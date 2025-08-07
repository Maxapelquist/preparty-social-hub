
-- 1) Gör user_id unik i profiles (en profil per användare)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- 2) Lägg till foreign key från parties.host_id till profiles.user_id
ALTER TABLE public.parties
ADD CONSTRAINT parties_host_id_fkey
FOREIGN KEY (host_id) REFERENCES public.profiles(user_id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- 3) Index för snabbare uppslag
CREATE INDEX IF NOT EXISTS parties_host_id_idx ON public.parties(host_id);
