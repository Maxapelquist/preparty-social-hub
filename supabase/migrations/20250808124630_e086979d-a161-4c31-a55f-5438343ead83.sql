-- Create group_conversations table for group chats
CREATE TABLE public.group_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Create group_messages table for group chat messages
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a group member
CREATE OR REPLACE FUNCTION public.is_group_member(user_id UUID, group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = is_group_member.user_id 
    AND gm.group_id = is_group_member.group_id
  );
$$;

-- Create function to check if user is group conversation participant
CREATE OR REPLACE FUNCTION public.is_group_conversation_participant(_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_conversations gc
    JOIN public.group_members gm ON gc.group_id = gm.group_id
    WHERE gc.id = _conversation_id AND gm.user_id = auth.uid()
  );
$$;

-- RLS Policies for group_conversations
CREATE POLICY "Group members can view conversations"
ON public.group_conversations
FOR SELECT
USING (is_group_conversation_participant(id));

CREATE POLICY "Group members can create conversations"
ON public.group_conversations
FOR INSERT
WITH CHECK (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can update conversations"
ON public.group_conversations
FOR UPDATE
USING (is_group_conversation_participant(id));

-- RLS Policies for group_messages
CREATE POLICY "Group members can view messages"
ON public.group_messages
FOR SELECT
USING (is_group_conversation_participant(conversation_id));

CREATE POLICY "Group members can send messages"
ON public.group_messages
FOR INSERT
WITH CHECK (is_group_conversation_participant(conversation_id) AND auth.uid() = sender_id);

CREATE POLICY "Senders can update their messages"
ON public.group_messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Create trigger to update conversation timestamp on new message
CREATE OR REPLACE FUNCTION public.touch_group_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.group_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_group_conversation_on_message
AFTER INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_group_conversation_on_message();

-- Add updated_at trigger for both tables
CREATE TRIGGER update_group_conversations_updated_at
BEFORE UPDATE ON public.group_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_messages_updated_at
BEFORE UPDATE ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();