-- Add foreign key constraint from group_members to groups
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Add foreign key constraint from group_members to profiles  
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint from friends to profiles
ALTER TABLE public.friends 
ADD CONSTRAINT friends_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.friends 
ADD CONSTRAINT friends_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;