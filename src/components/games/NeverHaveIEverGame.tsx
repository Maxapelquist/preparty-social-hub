import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Hand, Trophy, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Game {
  id: string;
  host_id: string;
  title: string;
  status: 'waiting' | 'active' | 'finished';
  current_question_id?: string;
  current_player_turn?: string;
  max_fingers: number;
}

interface Participant {
  id: string;
  user_id: string;
  fingers_remaining: number;
  is_eliminated: boolean;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Question {
  id: string;
  question: string;
  category: string;
}

interface GameProps {
  game: Game;
  onGameEnd: () => void;
}

export function NeverHaveIEverGame({ game, onGameEnd }: GameProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [hasIEver, setHasIEver] = useState<boolean | null>(null);
  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);

  const isHost = user?.id === game.host_id;

  useEffect(() => {
    fetchParticipants();
    if (game.current_question_id) {
      fetchCurrentQuestion();
    }
    setIsMyTurn(game.current_player_turn === user?.id);

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`game-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${game.id}`
        },
        () => fetchParticipants()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'never_have_i_ever_games',
          filter: `id=eq.${game.id}`
        },
        (payload) => {
          const updatedGame = payload.new as Game;
          setIsMyTurn(updatedGame.current_player_turn === user?.id);
          if (updatedGame.current_question_id && updatedGame.current_question_id !== currentQuestion?.id) {
            fetchCurrentQuestion();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id, user?.id]);

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('game_participants')
      .select(`
        id,
        user_id,
        fingers_remaining,
        is_eliminated
      `)
      .eq('game_id', game.id)
      .order('joined_at');

    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }

    // Fetch profiles separately
    const userIds = data?.map(p => p.user_id) || [];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    const participantsWithProfiles = data?.map(participant => ({
      ...participant,
      profiles: profilesMap.get(participant.user_id) || { display_name: 'Okänd användare', avatar_url: null }
    })) || [];

    setParticipants(participantsWithProfiles);
  };

  const fetchCurrentQuestion = async () => {
    if (!game.current_question_id) return;

    const { data, error } = await supabase
      .from('never_have_i_ever_questions')
      .select('*')
      .eq('id', game.current_question_id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return;
    }

    setCurrentQuestion(data);
    setHasIEver(null);
  };

  const getRandomQuestion = async (): Promise<Question | null> => {
    // Get used question IDs
    const { data: rounds } = await supabase
      .from('game_rounds')
      .select('question_id')
      .eq('game_id', game.id);

    const usedQuestionIds = rounds?.map(r => r.question_id) || [];

    // Get a random unused question
    const { data: questions, error } = await supabase
      .from('never_have_i_ever_questions')
      .select('*')
      .not('id', 'in', `(${usedQuestionIds.length > 0 ? usedQuestionIds.join(',') : 'null'})`)
      .limit(50);

    if (error || !questions || questions.length === 0) {
      console.error('Error fetching questions or no more questions available:', error);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  };

  const startNextRound = async () => {
    if (!isHost) return;

    const nextQuestion = await getRandomQuestion();
    if (!nextQuestion) {
      toast({
        title: "Inga fler frågor",
        description: "Alla frågor har använts!",
        variant: "destructive",
      });
      return;
    }

    // Get next player
    const activePlayers = participants.filter(p => !p.is_eliminated);
    const currentPlayerIndex = activePlayers.findIndex(p => p.user_id === game.current_player_turn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];

    // Update game
    const { error } = await supabase
      .from('never_have_i_ever_games')
      .update({
        current_question_id: nextQuestion.id,
        current_player_turn: nextPlayer.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id);

    if (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Fel",
        description: "Kunde inte starta nästa runda",
        variant: "destructive",
      });
      return;
    }

    // Create game round
    const { data: roundData } = await supabase
      .from('game_rounds')
      .select('round_number')
      .eq('game_id', game.id)
      .order('round_number', { ascending: false })
      .limit(1);

    const nextRoundNumber = (roundData?.[0]?.round_number || 0) + 1;

    await supabase
      .from('game_rounds')
      .insert({
        game_id: game.id,
        question_id: nextQuestion.id,
        asked_by: nextPlayer.user_id,
        round_number: nextRoundNumber,
        participants_who_did: []
      });

    setQuestionHistory(prev => [...prev, nextQuestion]);
  };

  const handleAnswer = async (didIt: boolean) => {
    if (!user || !currentQuestion) return;

    setHasIEver(didIt);

    if (didIt) {
      // Reduce finger count
      const currentParticipant = participants.find(p => p.user_id === user.id);
      if (!currentParticipant) return;

      const newFingersRemaining = currentParticipant.fingers_remaining - 1;
      const isEliminated = newFingersRemaining <= 0;

      const { error } = await supabase
        .from('game_participants')
        .update({
          fingers_remaining: newFingersRemaining,
          is_eliminated: isEliminated
        })
        .eq('id', currentParticipant.id);

      if (error) {
        console.error('Error updating participant:', error);
        return;
      }

      if (isEliminated) {
        toast({
          title: "Du är ute!",
          description: "Du har inga fingrar kvar.",
        });
      }

      // Update game round with participant who did it
      const { data: currentRound } = await supabase
        .from('game_rounds')
        .select('participants_who_did')
        .eq('game_id', game.id)
        .eq('question_id', currentQuestion.id)
        .single();

      if (currentRound) {
        const participantsDid = currentRound.participants_who_did as string[] || [];
        if (!participantsDid.includes(user.id)) {
          participantsDid.push(user.id);
          
          await supabase
            .from('game_rounds')
            .update({
              participants_who_did: participantsDid
            })
            .eq('game_id', game.id)
            .eq('question_id', currentQuestion.id);
        }
      }
    }

    toast({
      title: didIt ? "Du sänkte ett finger!" : "Du behöll dina fingrar",
      description: didIt ? "Du har gjort det där!" : "Du har aldrig gjort det där",
    });
  };

  const renderFingers = (count: number, maxFingers: number) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: maxFingers }, (_, i) => (
          <Hand
            key={i}
            size={16}
            className={i < count ? "text-primary" : "text-muted-foreground/30"}
            fill={i < count ? "currentColor" : "none"}
          />
        ))}
      </div>
    );
  };

  const activePlayers = participants.filter(p => !p.is_eliminated);
  const winner = activePlayers.length === 1 ? activePlayers[0] : null;

  if (winner) {
    return (
      <Card className="p-6 text-center glass card-shadow">
        <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold mb-2">🎉 Vinnare! 🎉</h2>
        <p className="text-lg mb-4">
          {winner.profiles.display_name} vann spelet!
        </p>
        <Button onClick={onGameEnd} className="gradient-primary">
          Tillbaka till spel
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="p-4 glass card-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{game.title}</h2>
            <p className="text-sm text-muted-foreground">
              {activePlayers.length} spelare kvar
            </p>
          </div>
          <Badge variant="secondary">
            Runda {questionHistory.length + 1}
          </Badge>
        </div>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="p-6 glass card-shadow gradient-hero text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            {currentQuestion.question}
          </h3>
          <Badge variant="secondary" className="mb-4">
            {currentQuestion.category}
          </Badge>
          
          {hasIEver === null && (
            <div className="space-y-4">
              <p className="text-lg opacity-90">Har du gjort det här?</p>
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={() => handleAnswer(true)}
                  variant="secondary"
                  size="lg"
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/30"
                >
                  Ja, jag har gjort det
                </Button>
                <Button
                  onClick={() => handleAnswer(false)}
                  variant="secondary"
                  size="lg"
                  className="bg-green-500/20 hover:bg-green-500/30 text-white border-green-500/30"
                >
                  Nej, aldrig
                </Button>
              </div>
            </div>
          )}

          {hasIEver !== null && (
            <div className="space-y-4">
              <p className="text-lg">
                {hasIEver ? "Du sänkte ett finger!" : "Du behöll dina fingrar"}
              </p>
              {isHost && (
                <Button
                  onClick={startNextRound}
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <RotateCcw size={20} className="mr-2" />
                  Nästa fråga
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Participants */}
      <Card className="p-4 glass card-shadow">
        <h3 className="font-semibold mb-4 flex items-center">
          <Users size={20} className="mr-2" />
          Spelare ({participants.length})
        </h3>
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                participant.is_eliminated
                  ? 'opacity-50 bg-muted/50'
                  : participant.user_id === game.current_player_turn
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-background/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {participant.profiles.display_name}
                    {participant.user_id === game.current_player_turn && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        På tur
                      </Badge>
                    )}
                    {participant.is_eliminated && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Ute
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {renderFingers(participant.fingers_remaining, game.max_fingers)}
                <span className="text-sm text-muted-foreground">
                  {participant.fingers_remaining}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!currentQuestion && isHost && (
        <Card className="p-4 glass card-shadow text-center">
          <Button
            onClick={startNextRound}
            size="lg"
            className="gradient-primary"
          >
            Starta första frågan
          </Button>
        </Card>
      )}
    </div>
  );
}