
BEGIN;

-- 1) Ersätt SELECT-policy på never_have_i_ever_games så den INTE refererar direkt till game_participants
DROP POLICY IF EXISTS "Game participants can view games" ON public.never_have_i_ever_games;

CREATE POLICY "Host or participants can view games"
  ON public.never_have_i_ever_games
  FOR SELECT
  USING (
    auth.uid() = host_id
    OR public.is_game_participant(id)
  );

-- 2) Justera game_participants (undvik själv-referens i SELECT-policy)
-- Städa bort ev. gamla policies
DROP POLICY IF EXISTS "Participants can view participants in their games" ON public.game_participants;
DROP POLICY IF EXISTS "Game participants can view participants" ON public.game_participants;

-- Ny SELECT-policy: använd endast "egen rad" ELLER "host ser alla i sitt spel"
CREATE POLICY "Host or same-user can view participant rows"
  ON public.game_participants
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.never_have_i_ever_games g
      WHERE g.id = game_participants.game_id
        AND g.host_id = auth.uid()
    )
  );

-- Behåll/bibehåll befintliga INSERT/UPDATE-policies (de är redan säkra och icke-rekursiva)
-- Om "Host can add participants to their games" inte finns av tidigare migrationer, kör denna (idempotent med IF NOT EXISTS):
CREATE POLICY IF NOT EXISTS "Host can add participants to their games"
  ON public.game_participants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.never_have_i_ever_games g
      WHERE g.id = game_id
        AND g.host_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- 3) Uppdatera game_rounds så de använder helper-funktionen i stället för direkta referenser
DROP POLICY IF EXISTS "Game participants can view rounds" ON public.game_rounds;

CREATE POLICY "Participants can view rounds"
  ON public.game_rounds
  FOR SELECT
  USING (public.is_game_participant(game_id));

DROP POLICY IF EXISTS "Game participants can create rounds" ON public.game_rounds;

CREATE POLICY "Participants can create rounds"
  ON public.game_rounds
  FOR INSERT
  WITH CHECK (public.is_game_participant(game_id));

-- 4) RPC som hämtar alla deltagare i ett spel (inkl. profilinfo)
CREATE OR REPLACE FUNCTION public.get_game_participants(p_game_id uuid)
RETURNS TABLE (
  id uuid,
  game_id uuid,
  user_id uuid,
  fingers_remaining integer,
  is_eliminated boolean,
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT
    gp.id,
    gp.game_id,
    gp.user_id,
    gp.fingers_remaining,
    gp.is_eliminated,
    pr.display_name,
    pr.username,
    pr.avatar_url
  FROM public.game_participants gp
  LEFT JOIN public.profiles pr
    ON pr.user_id = gp.user_id
  WHERE gp.game_id = p_game_id
  ORDER BY pr.display_name NULLS LAST, gp.joined_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_game_participants(uuid) TO authenticated;

COMMIT;
