-- Add foreign key constraint for party_attendees to profiles
ALTER TABLE public.party_attendees 
ADD CONSTRAINT fk_party_attendees_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;