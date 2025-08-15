-- Create table for Never Have I Ever games
CREATE TABLE public.never_have_i_ever_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Jag har aldrig',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_id UUID,
  current_player_turn UUID,
  max_fingers INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for game questions
CREATE TABLE public.never_have_i_ever_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'funny', 'spicy', 'innocent', 'wild')),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for game participants
CREATE TABLE public.game_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  user_id UUID NOT NULL,
  fingers_remaining INTEGER NOT NULL DEFAULT 5,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create table for game rounds/questions asked
CREATE TABLE public.game_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  question_id UUID NOT NULL,
  asked_by UUID NOT NULL,
  round_number INTEGER NOT NULL,
  participants_who_did JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.never_have_i_ever_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.never_have_i_ever_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
CREATE POLICY "Game participants can view games" 
ON public.never_have_i_ever_games 
FOR SELECT 
USING (
  auth.uid() = host_id OR 
  EXISTS (SELECT 1 FROM public.game_participants WHERE game_id = never_have_i_ever_games.id AND user_id = auth.uid())
);

CREATE POLICY "Users can create games" 
ON public.never_have_i_ever_games 
FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update games" 
ON public.never_have_i_ever_games 
FOR UPDATE 
USING (auth.uid() = host_id);

-- RLS Policies for questions
CREATE POLICY "Questions are viewable by everyone" 
ON public.never_have_i_ever_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create custom questions" 
ON public.never_have_i_ever_questions 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- RLS Policies for participants
CREATE POLICY "Game participants can view participants" 
ON public.game_participants 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.game_participants gp WHERE gp.game_id = game_participants.game_id AND gp.user_id = auth.uid())
);

CREATE POLICY "Users can join games" 
ON public.game_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can update their own data" 
ON public.game_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for rounds
CREATE POLICY "Game participants can view rounds" 
ON public.game_rounds 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.game_participants WHERE game_id = game_rounds.game_id AND user_id = auth.uid())
);

CREATE POLICY "Game participants can create rounds" 
ON public.game_rounds 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_participants WHERE game_id = game_rounds.game_id AND user_id = auth.uid())
);

-- Add triggers for updated_at
CREATE TRIGGER update_never_have_i_ever_games_updated_at
BEFORE UPDATE ON public.never_have_i_ever_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions
INSERT INTO public.never_have_i_ever_questions (question, category) VALUES
('Jag har aldrig... kysst någon på första dejten', 'spicy'),
('Jag har aldrig... sjungit karaoke', 'funny'),
('Jag har aldrig... ätit insekter', 'wild'),
('Jag har aldrig... somnat på bio', 'innocent'),
('Jag har aldrig... ljugit om min ålder', 'general'),
('Jag har aldrig... dansat på ett bord', 'funny'),
('Jag har aldrig... glömt någons namn direkt efter presentation', 'innocent'),
('Jag har aldrig... skickat ett meddelande till fel person', 'general'),
('Jag har aldrig... ätit glass till frukost', 'innocent'),
('Jag har aldrig... gått vilse i min egen stad', 'funny'),
('Jag har aldrig... falsksungnit nationalantonen', 'funny'),
('Jag har aldrig... pratat med mig själv högt', 'innocent'),
('Jag har aldrig... stalkat någon på sociala medier', 'general'),
('Jag har aldrig... ljugit i en jobbintervju', 'general'),
('Jag har aldrig... somnat i solen och blivit bränd', 'innocent'),
('Jag har aldrig... ätit något jag tappat på golvet', 'funny'),
('Jag har aldrig... fingerat att vara sjuk för att slippa jobba', 'general'),
('Jag har aldrig... druckit mjölk direkt från paketet', 'innocent'),
('Jag har aldrig... gått i fel riktning och låtsats som det var meningen', 'funny'),
('Jag har aldrig... haft en kändiskross', 'innocent'),
('Jag har aldrig... sovit med sockor på', 'innocent'),
('Jag har aldrig... ätit middag till frukost', 'innocent'),
('Jag har aldrig... glömt var jag parkerat bilen', 'general'),
('Jag har aldrig... känt mig konstig när jag ätit ensam på restaurang', 'general'),
('Jag har aldrig... haft en hemlig dagbok', 'innocent'),
('Jag har aldrig... gått ut med två olika skor', 'funny'),
('Jag har aldrig... sjungit i duschen', 'innocent'),
('Jag har aldrig... fingerat att jag förstod ett skämt', 'funny'),
('Jag har aldrig... ätit choklad till frukost', 'innocent'),
('Jag har aldrig... drömt om någon jag känner', 'general'),
('Jag har aldrig... dansat när jag är ensam hemma', 'innocent'),
('Jag har aldrig... känt mig generad över min musiksmak', 'general'),
('Jag har aldrig... talat med djur som om de förstod', 'innocent'),
('Jag har aldrig... gått på fel föreställning/film', 'funny'),
('Jag har aldrig... haft ångest över att välja restaurang', 'general'),
('Jag har aldrig... slickat tallriken ren', 'funny'),
('Jag har aldrig... bytt kanal när föräldrar kommer in', 'general'),
('Jag har aldrig... känt mig dum för att jag inte förstod en referens', 'general'),
('Jag har aldrig... ätit glass när det regnar', 'innocent'),
('Jag har aldrig... tittat på barn-TV som vuxen', 'innocent'),
('Jag har aldrig... gått till sängs före 21:00 som vuxen', 'innocent'),
('Jag har aldrig... känt mig cool för något jag gjort', 'general'),
('Jag har aldrig... haft en imagninär vän som barn', 'innocent'),
('Jag har aldrig... ätit något bara för att det såg bra ut på bild', 'general'),
('Jag har aldrig... känt mig gammal på grund av ny teknik', 'funny'),
('Jag har aldrig... drömt om att vara känd', 'general'),
('Jag har aldrig... haft en konstig fobia', 'general'),
('Jag har aldrig... känt mig förvirrad över min egen handskrift', 'funny'),
('Jag har aldrig... pratat med kundtjänst i mer än 30 minuter', 'general'),
('Jag har aldrig... känt mig dum för att jag tryckte på "push" när det stod "pull"', 'funny');