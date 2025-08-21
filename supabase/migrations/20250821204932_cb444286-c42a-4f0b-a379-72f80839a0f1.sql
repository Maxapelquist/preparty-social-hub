
-- 1) Koppla spel till fest
ALTER TABLE public.never_have_i_ever_games
ADD COLUMN IF NOT EXISTS party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL;

-- 2) Förbättra visning av fester: tillåt värd och deltagare att se sina fester
-- (befintlig policy "Parties visibility based on group membership" finns kvar)
CREATE POLICY "Hosts can view their parties"
  ON public.parties
  FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Attendees can view their parties"
  ON public.parties
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.party_attendees pa
    WHERE pa.party_id = parties.id AND pa.user_id = auth.uid()
  ));

-- 3) Låt värden lägga till deltagare i sitt spel
CREATE POLICY "Host can add participants to their games"
  ON public.game_participants
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.never_have_i_ever_games g
    WHERE g.id = game_participants.game_id AND g.host_id = auth.uid()
  ));

-- 4) Hjälpfunktion för att undvika rekursion i SELECT-policyer
CREATE OR REPLACE FUNCTION public.is_game_participant(_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_participants
    WHERE game_id = _game_id AND user_id = auth.uid()
  );
$$;

-- 5) Tillåt värd eller deltagare att se spelarnas rader (utan rekursiv policy)
CREATE POLICY "Participants or host can view participants"
  ON public.game_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.never_have_i_ever_games g
      WHERE g.id = game_participants.game_id AND g.host_id = auth.uid()
    )
    OR public.is_game_participant(game_participants.game_id)
  );

-- 6) Säker RPC (CREATE OR REPLACE är idempotent) för att hämta deltagare med profilinfo
CREATE OR REPLACE FUNCTION public.get_game_participants(p_game_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  fingers_remaining integer,
  is_eliminated boolean,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    gp.id,
    gp.user_id,
    gp.fingers_remaining,
    gp.is_eliminated,
    p.display_name,
    p.username,
    p.avatar_url
  FROM public.game_participants gp
  JOIN public.profiles p ON p.user_id = gp.user_id
  WHERE gp.game_id = p_game_id
  ORDER BY p.display_name NULLS LAST;
$$;
