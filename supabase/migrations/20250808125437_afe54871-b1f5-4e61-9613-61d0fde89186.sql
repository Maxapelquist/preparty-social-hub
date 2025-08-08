-- Test current auth context
CREATE OR REPLACE FUNCTION public.debug_group_member_check(_group_id UUID)
RETURNS TABLE (
  current_user_id UUID,
  is_member BOOLEAN,
  member_exists BOOLEAN
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    auth.uid() as current_user_id,
    is_group_member(auth.uid(), _group_id) as is_member,
    EXISTS(
      SELECT 1 FROM public.group_members gm
      WHERE gm.user_id = auth.uid() AND gm.group_id = _group_id
    ) as member_exists;
$$;

-- Update the policy to be more explicit
DROP POLICY IF EXISTS "Group members can create conversations" ON public.group_conversations;

CREATE POLICY "Group members can create conversations"
ON public.group_conversations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid() AND gm.group_id = group_conversations.group_id
  )
);