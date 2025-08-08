-- Recreate the is_group_member function
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

-- Create a simple debug function without using the other function
CREATE OR REPLACE FUNCTION public.debug_group_member_check(_group_id UUID)
RETURNS TABLE (
  current_user_id UUID,
  member_exists BOOLEAN
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    auth.uid() as current_user_id,
    EXISTS(
      SELECT 1 FROM public.group_members gm
      WHERE gm.user_id = auth.uid() AND gm.group_id = _group_id
    ) as member_exists;
$$;

-- Create a simplified policy that avoids function calls
CREATE POLICY "Group members can create conversations"
ON public.group_conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid() AND gm.group_id = group_conversations.group_id
  )
);