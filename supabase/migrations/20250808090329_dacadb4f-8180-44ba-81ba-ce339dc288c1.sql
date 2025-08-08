-- Phase 1: Fix duplicate friend relationships
-- Add unique constraint to prevent duplicate friendships (bidirectional)
-- The constraint ensures that for any two users A and B, only one friendship record exists
-- regardless of who initiated it (either A->B or B->A, but not both)

-- First, add a function to generate a unique pair key
CREATE OR REPLACE FUNCTION generate_friendship_pair_key(user_a uuid, user_b uuid)
RETURNS text AS $$
BEGIN
  -- Always put the smaller UUID first to ensure consistency
  IF user_a < user_b THEN
    RETURN user_a::text || '_' || user_b::text;
  ELSE
    RETURN user_b::text || '_' || user_a::text;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add pair_key column to friends table if it doesn't exist
ALTER TABLE public.friends 
ADD COLUMN IF NOT EXISTS pair_key text;

-- Create an index on pair_key for better performance
CREATE INDEX IF NOT EXISTS idx_friends_pair_key ON public.friends(pair_key);

-- Update existing records to have pair_key
UPDATE public.friends 
SET pair_key = generate_friendship_pair_key(user_id, friend_id)
WHERE pair_key IS NULL;

-- Add unique constraint on pair_key to prevent duplicate friendships
ALTER TABLE public.friends 
ADD CONSTRAINT unique_friendship_pair 
UNIQUE (pair_key);

-- Create trigger to automatically set pair_key on insert/update
CREATE OR REPLACE FUNCTION set_friendship_pair_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pair_key = generate_friendship_pair_key(NEW.user_id, NEW.friend_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_friendship_pair_key
  BEFORE INSERT OR UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION set_friendship_pair_key();

-- Update RLS policies to handle bidirectional friendships properly
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own friend relationships" ON public.friends;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friends;
DROP POLICY IF EXISTS "Users can update their friend relationships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their friend relationships" ON public.friends;

-- Create new bidirectional-aware policies
CREATE POLICY "Users can view their friendships" 
ON public.friends 
FOR SELECT 
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can create friend requests" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" 
ON public.friends 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));

CREATE POLICY "Users can delete their friendships" 
ON public.friends 
FOR DELETE 
USING ((auth.uid() = user_id) OR (auth.uid() = friend_id));