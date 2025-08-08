-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);

-- Create storage policies for profile pictures
CREATE POLICY "Users can view all profile pictures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile pictures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update profiles table to support multiple profile pictures
ALTER TABLE profiles 
ADD COLUMN profile_pictures text[] DEFAULT '{}';

-- Keep avatar_url for backward compatibility (can be the first/main picture)
COMMENT ON COLUMN profiles.profile_pictures IS 'Array of profile picture URLs';
COMMENT ON COLUMN profiles.avatar_url IS 'Main profile picture URL (backward compatibility)';

-- Update the upsert_profile_simple function to handle profile pictures
CREATE OR REPLACE FUNCTION public.upsert_profile_simple(
  p_display_name text, 
  p_username text, 
  p_age integer, 
  p_bio text, 
  p_university text, 
  p_occupation text, 
  p_phone_number text, 
  p_interests text[], 
  p_location_lat numeric, 
  p_location_lng numeric, 
  p_location_name text,
  p_profile_pictures text[] DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result json;
  current_user_id uuid;
  main_avatar text;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Set main avatar as first picture if pictures provided
  main_avatar := CASE 
    WHEN array_length(p_profile_pictures, 1) > 0 THEN p_profile_pictures[1]
    ELSE NULL
  END;

  -- Upsert the profile using RLS for security
  INSERT INTO public.profiles (
    user_id, display_name, username, age, bio, university, occupation,
    phone_number, interests, location_lat, location_lng, location_name, 
    profile_pictures, avatar_url, updated_at
  )
  VALUES (
    current_user_id, p_display_name, p_username, p_age, p_bio, p_university, p_occupation,
    p_phone_number, p_interests, p_location_lat, p_location_lng, p_location_name,
    p_profile_pictures, main_avatar, now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username,
    age = EXCLUDED.age,
    bio = EXCLUDED.bio,
    university = EXCLUDED.university,
    occupation = EXCLUDED.occupation,
    phone_number = EXCLUDED.phone_number,
    interests = EXCLUDED.interests,
    location_lat = EXCLUDED.location_lat,
    location_lng = EXCLUDED.location_lng,
    location_name = EXCLUDED.location_name,
    profile_pictures = EXCLUDED.profile_pictures,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  -- Return the updated profile
  SELECT to_json(p.*) INTO result
  FROM public.profiles p
  WHERE p.user_id = current_user_id;

  RETURN result;
END;
$function$;