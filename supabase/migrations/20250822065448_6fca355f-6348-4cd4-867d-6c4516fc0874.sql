-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_add_group_members_to_party ON public.parties;

-- Create function to automatically add group members as party attendees
CREATE OR REPLACE FUNCTION public.add_group_members_to_party()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update current_attendees count
CREATE OR REPLACE FUNCTION public.update_party_attendees_count()
RETURNS TRIGGER AS $$
DECLARE
  party_uuid UUID;
BEGIN
  -- Get party_id from either NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    party_uuid := OLD.party_id;
  ELSE
    party_uuid := NEW.party_id;
  END IF;
  
  -- Update the current_attendees count
  UPDATE public.parties 
  SET current_attendees = (
    SELECT COUNT(*) 
    FROM public.party_attendees 
    WHERE party_id = party_uuid 
    AND status = 'attending'
  )
  WHERE id = party_uuid;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_add_group_members_to_party
  AFTER INSERT ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_members_to_party();

DROP TRIGGER IF EXISTS trigger_update_party_attendees_count ON public.party_attendees;
CREATE TRIGGER trigger_update_party_attendees_count
  AFTER INSERT OR UPDATE OR DELETE ON public.party_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_party_attendees_count();

-- Backfill: Add group members to existing parties that have a group_id
INSERT INTO public.party_attendees (party_id, user_id, status)
SELECT DISTINCT p.id, gm.user_id, 'attending'
FROM public.parties p
JOIN public.group_members gm ON gm.group_id = p.group_id
WHERE p.group_id IS NOT NULL
ON CONFLICT (party_id, user_id) DO NOTHING;

-- Backfill: Update current_attendees count for all parties
UPDATE public.parties 
SET current_attendees = (
  SELECT COUNT(*) 
  FROM public.party_attendees pa
  WHERE pa.party_id = parties.id 
  AND pa.status = 'attending'
);