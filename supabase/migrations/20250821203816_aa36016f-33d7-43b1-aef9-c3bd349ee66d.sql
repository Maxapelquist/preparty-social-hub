
BEGIN;

-- 1) Helper-funktion utan RLS-rekursion
CREATE OR REPLACE FUNCTION public.is_game_participant(_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_participants gp
    WHERE gp.game_id = _game_id
      AND gp.user_id = auth.uid()
  );
$function$;

-- 2) Byt ut SELECT-policyn som orsakar rekursion
DROP POLICY IF EXISTS "Game participants can view participants" ON public.game_participants;

CREATE POLICY "Participants can view participants in their games"
  ON public.game_participants
  FOR SELECT
  USING (public.is_game_participant(game_id));

-- 3) Tillåt host att lägga till deltagare i sitt spel
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
  );

COMMIT;
