-- Fix infinite recursion in never_have_i_ever_games RLS policies

-- Create security definer function to check if user is game participant
CREATE OR REPLACE FUNCTION public.is_game_participant_for_policy(_game_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.game_participants
    WHERE game_id = _game_id AND user_id = _user_id
  );
$function$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Game participants can view games" ON public.never_have_i_ever_games;
DROP POLICY IF EXISTS "Host can update games" ON public.never_have_i_ever_games;
DROP POLICY IF EXISTS "Users can create games" ON public.never_have_i_ever_games;

-- Recreate policies with security definer function to avoid recursion
CREATE POLICY "Users can create games" 
ON public.never_have_i_ever_games
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update games" 
ON public.never_have_i_ever_games
FOR UPDATE 
USING (auth.uid() = host_id);

CREATE POLICY "Game participants can view games" 
ON public.never_have_i_ever_games
FOR SELECT 
USING (
  (auth.uid() = host_id) OR 
  public.is_game_participant_for_policy(id, auth.uid())
);