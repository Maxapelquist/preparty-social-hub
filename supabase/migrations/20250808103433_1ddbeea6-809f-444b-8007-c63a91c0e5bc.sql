-- Update the upsert_profile function to handle auth token issues more gracefully
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
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result json;
  auth_user_exists boolean;
BEGIN
  -- Check if the requesting user matches the user_id and exists in auth.users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'User can only update their own profile';
  END IF;

  -- Check if user exists in auth.users with a more robust approach
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = p_user_id 
    AND deleted_at IS NULL
  ) INTO auth_user_exists;

  IF NOT auth_user_exists THEN
    -- Try to refresh the session and check again
    PERFORM pg_sleep(0.1);
    SELECT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = p_user_id 
      AND deleted_at IS NULL
    ) INTO auth_user_exists;
    
    IF NOT auth_user_exists THEN
      RAISE EXCEPTION 'Authentication session expired. Please refresh the page and try again.';
    END IF;
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
$function$;