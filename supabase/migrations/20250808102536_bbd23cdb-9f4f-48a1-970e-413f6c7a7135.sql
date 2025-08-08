-- Fix profiles table foreign key constraint by ensuring referential integrity
-- First, clean up any orphaned profiles that don't have corresponding auth users
DELETE FROM public.profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Update the handle_new_user function to have better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Only insert if user doesn't already have a profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a function to safely create or update profile
CREATE OR REPLACE FUNCTION public.upsert_profile(
  p_user_id uuid,
  p_display_name text,
  p_username text,
  p_age integer,
  p_bio text,
  p_university text,
  p_interests text[],
  p_location_lat numeric,
  p_location_lng numeric,
  p_location_name text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result json;
BEGIN
  -- Verify the user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth system';
  END IF;

  -- Upsert the profile
  INSERT INTO public.profiles (
    user_id, display_name, username, age, bio, university, 
    interests, location_lat, location_lng, location_name, updated_at
  )
  VALUES (
    p_user_id, p_display_name, p_username, p_age, p_bio, p_university,
    p_interests, p_location_lat, p_location_lng, p_location_name, now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username,
    age = EXCLUDED.age,
    bio = EXCLUDED.bio,
    university = EXCLUDED.university,
    interests = EXCLUDED.interests,
    location_lat = EXCLUDED.location_lat,
    location_lng = EXCLUDED.location_lng,
    location_name = EXCLUDED.location_name,
    updated_at = now();

  -- Return the updated profile
  SELECT to_json(p.*) INTO result
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  RETURN result;
END;
$$;