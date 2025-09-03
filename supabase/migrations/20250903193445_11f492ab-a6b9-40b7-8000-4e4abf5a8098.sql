-- Create security definer function to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.check_user_is_game_participant(game_id_param uuid, user_id_param uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.game_participants
    WHERE game_id = game_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Update the problematic RLS policy on game_rounds to use the security definer function
DROP POLICY IF EXISTS "Game participants can create rounds" ON public.game_rounds;

CREATE POLICY "Game participants can create rounds" 
ON public.game_rounds 
FOR INSERT 
WITH CHECK (public.check_user_is_game_participant(game_id, auth.uid()));

-- Also fix the game_participants policy that might be causing recursion
DROP POLICY IF EXISTS "Game participants can view participants" ON public.game_participants;

CREATE POLICY "Game participants can view participants" 
ON public.game_participants 
FOR SELECT 
USING (public.check_user_is_game_participant(game_id, auth.uid()));