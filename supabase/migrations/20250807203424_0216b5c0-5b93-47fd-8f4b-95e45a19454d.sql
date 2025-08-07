
-- 1) Lägg till username-kolumn på profiler
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- 2) Case-insensitiv unikhet för username (ignorera NULL)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci
ON public.profiles (lower(username))
WHERE username IS NOT NULL;

-- 3) Förhindra dubbletter av vänförfrågningar i samma riktning
ALTER TABLE public.friends
ADD CONSTRAINT friends_unique_pair UNIQUE (user_id, friend_id);
