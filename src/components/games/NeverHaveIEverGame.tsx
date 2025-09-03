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
  party_id?: string;
}

interface Participant {
  id: string;
  user_id: string;
  fingers_remaining: number;
  is_eliminated: boolean;
  display_name: string;
  username: string;
  avatar_url?: string;
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
      .rpc('get_game_participants', {
        p_game_id: game.id
      });

    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }

    if (data) {
      setParticipants(data as Participant[]);
    }
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
    let query = supabase
      .from('never_have_i_ever_questions')
      .select('*');

    // Only filter out used questions if there are any
    if (usedQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${usedQuestionIds.join(',')})`);
    }

    const { data: questions, error } = await query.limit(50);

    if (error || !questions || questions.length === 0) {
      console.error('Error fetching questions or no more questions available:', error);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  };

  const startNextRound = async () => {
    console.log('startNextRound called', { isHost, user: user?.id, gameHost: game.host_id });
    if (!isHost) {
      console.log('User is not host, returning');
      return;
    }

    console.log('Getting random question...');
    const nextQuestion = await getRandomQuestion();
    console.log('Got question:', nextQuestion);
    
    if (!nextQuestion) {
      console.log('No question found, showing toast');
      toast({
        title: "Inga fler frågor",
        description: "Alla frågor har använts!",
        variant: "destructive",
      });
      return;
    }

    console.log('Getting active players...');
    // Get next player
    const activePlayers = participants.filter(p => !p.is_eliminated);
    console.log('Active players:', activePlayers);
    
    const currentPlayerIndex = activePlayers.findIndex(p => p.user_id === game.current_player_turn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];
    console.log('Next player:', nextPlayer);

    console.log('Updating game in database...');
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

  const handleRemoveFinger = async (participantId: string, fingerIndex: number) => {
    if (!user) return;

    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    // Only allow host or the participant themselves to remove fingers
    if (!isHost && participant.user_id !== user.id) return;

    const newFingersRemaining = participant.fingers_remaining - 1;
    const isEliminated = newFingersRemaining <= 0;

    const { error } = await supabase
      .from('game_participants')
      .update({
        fingers_remaining: newFingersRemaining,
        is_eliminated: isEliminated
      })
      .eq('id', participantId);

    if (error) {
      console.error('Error updating participant:', error);
      return;
    }

    if (isEliminated) {
      toast({
        title: participant.user_id === user.id ? "Du är ute!" : `${participant.display_name} är ute!`,
        description: "Inga fingrar kvar.",
      });
    } else {
      toast({
        title: "Finger borttaget!",
        description: `${participant.display_name} har ${newFingersRemaining} fingrar kvar`,
      });
    }

    // Refresh participants
    fetchParticipants();
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
          {winner.display_name} vann spelet!
        </p>
        <Button onClick={onGameEnd} className="gradient-primary">
          Tillbaka till spel
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Blurred Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 backdrop-blur-sm" />
      
      {/* Game Content */}
      <div className="relative z-10 p-4 space-y-6">
        {/* Game Header */}
        <Card className="p-4 glass card-shadow backdrop-blur-md bg-background/80">
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

        {/* Current Question Card */}
        {currentQuestion && (
          <div className="flex justify-center">
            <Card className="w-full max-w-md aspect-[3/4] p-6 glass card-shadow backdrop-blur-md bg-gradient-to-br from-primary to-primary-foreground text-primary-foreground shadow-2xl border-primary/20">
              <div className="h-full flex flex-col justify-between text-center">
                <div className="space-y-4">
                  <Badge variant="secondary" className="bg-background/20 text-primary-foreground border-background/30">
                    {currentQuestion.category}
                  </Badge>
                  <h3 className="text-xl font-bold leading-tight">
                    {currentQuestion.question}
                  </h3>
                </div>
                
                {hasIEver === null && (
                  <div className="space-y-6">
                    <p className="text-lg opacity-90">Har du gjort det här?</p>
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleAnswer(true)}
                        variant="secondary"
                        size="lg"
                        className="w-full bg-red-500/30 hover:bg-red-500/40 text-white border-red-500/40 backdrop-blur-sm"
                      >
                        Ja, sänk finger! 👇
                      </Button>
                      <Button
                        onClick={() => handleAnswer(false)}
                        variant="secondary"
                        size="lg"
                        className="w-full bg-green-500/30 hover:bg-green-500/40 text-white border-green-500/40 backdrop-blur-sm"
                      >
                        Nej, behåll finger! ✋
                      </Button>
                    </div>
                  </div>
                )}

                {hasIEver !== null && (
                  <div className="space-y-4">
                    <p className="text-lg font-semibold">
                      {hasIEver ? "🔥 Du sänkte ett finger!" : "✨ Du behöll dina fingrar"}
                    </p>
                    {isHost && (
                      <Button
                        onClick={startNextRound}
                        variant="secondary"
                        size="lg"
                        className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground backdrop-blur-sm"
                      >
                        <RotateCcw size={20} className="mr-2" />
                        Nästa fråga
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-4">
          {participants.map((participant) => (
            <Card 
              key={participant.id}
              className={`p-4 glass card-shadow backdrop-blur-md transition-all duration-200 ${
                participant.is_eliminated
                  ? 'opacity-50 bg-background/40'
                  : participant.user_id === game.current_player_turn
                  ? 'bg-primary/20 border-primary/40 ring-2 ring-primary/30'
                  : 'bg-background/60 hover:bg-background/70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {participant.display_name}
                  </span>
                  {participant.user_id === game.current_player_turn && (
                    <Badge variant="secondary" className="text-xs">
                      På tur
                    </Badge>
                  )}
                  {participant.is_eliminated && (
                    <Badge variant="destructive" className="text-xs">
                      Ute
                    </Badge>
                  )}
                </div>
                
                {/* Clickable Fingers */}
                <div className="space-y-2">
                  <div className="flex justify-center space-x-1">
                    {Array.from({ length: game.max_fingers }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i < participant.fingers_remaining && (isHost || participant.user_id === user?.id)) {
                            // Handle finger click to remove life
                            handleRemoveFinger(participant.id, i);
                          }
                        }}
                        className={`transition-all duration-200 ${
                          i < participant.fingers_remaining 
                            ? "text-primary hover:text-primary/70 hover:scale-110 cursor-pointer" 
                            : "text-muted-foreground/30"
                        }`}
                        disabled={participant.is_eliminated || (i >= participant.fingers_remaining)}
                      >
                        <Hand
                          size={20}
                          fill={i < participant.fingers_remaining ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                      {participant.fingers_remaining} fingrar kvar
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!currentQuestion && isHost && (
          <div className="flex justify-center">
            <Card className="p-6 glass card-shadow backdrop-blur-md bg-background/80 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Debug: isHost={isHost.toString()}, currentQuestion={currentQuestion ? 'exists' : 'null'}
              </p>
              <Button
                onClick={() => {
                  console.log('Button clicked!');
                  startNextRound();
                }}
                size="lg"
                className="gradient-primary"
              >
                🚀 Starta första frågan
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
