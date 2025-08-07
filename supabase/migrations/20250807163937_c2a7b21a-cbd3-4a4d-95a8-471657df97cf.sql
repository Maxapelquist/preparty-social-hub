-- Create friends table for storing friend relationships
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table for many-to-many relationship
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friends table
CREATE POLICY "Users can view their own friend relationships" 
ON public.friends 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend relationships" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friend relationships" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create RLS policies for groups table
CREATE POLICY "Groups are viewable by everyone" 
ON public.groups 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their groups" 
ON public.groups 
FOR UPDATE 
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their groups" 
ON public.groups 
FOR DELETE 
USING (auth.uid() = admin_id);

-- Create RLS policies for group_members table
CREATE POLICY "Group members are viewable by everyone" 
ON public.group_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- Group admins can manage members
CREATE POLICY "Group admins can manage members" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE groups.id = group_members.group_id 
    AND groups.admin_id = auth.uid()
  )
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_friends_updated_at
BEFORE UPDATE ON public.friends
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();