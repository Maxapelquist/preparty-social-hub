-- Create a simpler profile upsert function that relies on RLS instead of manual auth checks
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
  p_location_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  result json;
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Upsert the profile using RLS for security
  INSERT INTO public.profiles (
    user_id, display_name, username, age, bio, university, occupation,
    phone_number, interests, location_lat, location_lng, location_name, updated_at
  )
  VALUES (
    current_user_id, p_display_name, p_username, p_age, p_bio, p_university, p_occupation,
    p_phone_number, p_interests, p_location_lat, p_location_lng, p_location_name, now()
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
    updated_at = now();

  -- Return the updated profile
  SELECT to_json(p.*) INTO result
  FROM public.profiles p
  WHERE p.user_id = current_user_id;

  RETURN result;
END;
$$;