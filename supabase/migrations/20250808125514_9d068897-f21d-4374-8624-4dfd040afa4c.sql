-- Drop and recreate the policy
DROP POLICY IF EXISTS "Group members can create conversations" ON public.group_conversations;

-- Recreate the is_group_member function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = _user_id 
    AND gm.group_id = _group_id
  );
$$;

-- Create a simplified policy that uses direct SQL instead of function
CREATE POLICY "Group members can create conversations"
ON public.group_conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid() AND gm.group_id = group_conversations.group_id
  )
);