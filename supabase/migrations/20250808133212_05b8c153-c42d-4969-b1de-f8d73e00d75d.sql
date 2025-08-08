-- Add group_id to parties table
ALTER TABLE public.parties 
ADD COLUMN group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Add is_public column (if it doesn't exist already)
ALTER TABLE public.parties 
ADD COLUMN is_public boolean DEFAULT false;

-- Update RLS policies for parties to handle group-based visibility
DROP POLICY IF EXISTS "Parties are viewable by everyone" ON public.parties;

-- New policy: Public parties are viewable by everyone, private parties only by group members
CREATE POLICY "Parties visibility based on group membership" 
ON public.parties 
FOR SELECT 
USING (
  is_public = true 
  OR 
  (group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))
);

-- Allow party hosts to create parties with groups
CREATE POLICY "Users can create parties with their groups" 
ON public.parties 
FOR INSERT 
WITH CHECK (
  auth.uid() = host_id 
  AND 
  (group_id IS NULL OR is_group_member(auth.uid(), group_id))
);

-- Function to automatically add group members as party attendees
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

-- Create trigger to automatically add group members when party is created
CREATE TRIGGER trigger_add_group_members_to_party
  AFTER INSERT ON public.parties
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_members_to_party();