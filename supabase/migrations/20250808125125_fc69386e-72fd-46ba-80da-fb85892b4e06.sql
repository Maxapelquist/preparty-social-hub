-- First drop the policy that depends on the function
DROP POLICY IF EXISTS "Group members can create conversations" ON public.group_conversations;

-- Then drop and recreate the function with corrected parameter names
DROP FUNCTION IF EXISTS public.is_group_member(UUID, UUID);

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

-- Recreate the policy with the corrected function
CREATE POLICY "Group members can create conversations"
ON public.group_conversations
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id));