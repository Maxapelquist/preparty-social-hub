-- Add foreign key relationship between parties.host_id and profiles.user_id
ALTER TABLE public.parties 
ADD CONSTRAINT fk_parties_host_id 
FOREIGN KEY (host_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;