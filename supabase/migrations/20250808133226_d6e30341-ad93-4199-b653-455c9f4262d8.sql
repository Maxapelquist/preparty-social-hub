-- Fix function search_path issues for the new function
CREATE OR REPLACE FUNCTION public.add_group_members_to_party()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- If a group_id is specified, add all group members as attendees
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO public.party_attendees (party_id, user_id, status)
    SELECT NEW.id, gm.user_id, 'attending'
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id
    ON CONFLICT (party_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;