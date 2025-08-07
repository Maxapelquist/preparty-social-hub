import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Clock, Star, Play, Shuffle, Trophy } from "lucide-react";

export function GamesView() {
  const popularGames = [
    {
      id: 1,
      name: "Sanning eller Konsekvens",
      category: "Klassiker",
      players: "3-20 spelare",
      duration: "15-30 min",
      difficulty: "Lätt",
      description: "Den klassiska leken som alltid funkar på fester!",
      rating: 4.8,
      played: 1250
    },
    {
      id: 2,
      name: "Never Have I Ever",
      category: "Upptäck",
      players: "4-15 spelare",
      duration: "10-25 min",
      difficulty: "Lätt",
      description: "Lär känna nya människor på ett roligt sätt.",
      rating: 4.6,
      played: 890
    },
    {
      id: 3,
      name: "Musikgissning",
      category: "Musik",
      players: "2-20 spelare",
      duration: "20-40 min",
      difficulty: "Medium",
      description: "Gissa låtar och artister för att vinna!",
      rating: 4.7,
      played: 750
    },
    {
      id: 4,
      name: "Charades Party",
      category: "Aktivitet",
      players: "4-16 spelare",
      duration: "15-35 min",
      difficulty: "Medium",
      description: "Visa med kroppen - andra ska gissa!",
      rating: 4.5,
      played: 650
    }
  ];

  const recentGames = [
    {
      name: "Sanning eller Konsekvens",
      group: "KTH Crew",
      time: "2h sedan",
      players: 6
    },
    {
      name: "Musikgissning",
      group: "Söder Squad",
      time: "1 dag sedan",
      players: 8
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Lätt": return "gradient-accent";
      case "Medium": return "gradient-secondary";
      case "Svår": return "gradient-primary";
      default: return "gradient-primary";
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Festlekar
          </h1>
          <Button className="gradient-primary text-white button-shadow">
            <Shuffle size={20} className="mr-2" />
            Slumpa
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="glass h-16 flex-col">
            <Play size={20} className="mb-1" />
            <span className="text-xs">Snabbstart</span>
          </Button>
          <Button variant="outline" className="glass h-16 flex-col">
            <Trophy size={20} className="mb-1" />
            <span className="text-xs">Tävlingar</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
              {popularGames.length}
            </p>
            <p className="text-xs text-muted-foreground">Tillgängliga</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-secondary bg-clip-text text-transparent">
              {recentGames.length}
            </p>
            <p className="text-xs text-muted-foreground">Senaste</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-accent bg-clip-text text-transparent">
              4.7
            </p>
            <p className="text-xs text-muted-foreground">Snittbetyg</p>
          </Card>
        </div>

        {/* Recent Games */}
        {recentGames.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Clock size={20} className="mr-2 text-accent" />
              Senast Spelade
            </h2>

            {recentGames.map((game, index) => (
              <Card key={index} className="p-4 glass card-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 gradient-accent rounded-lg">
                      <Gamepad2 size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{game.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {game.group} • {game.players} spelare • {game.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="glass">
                    Spela Igen
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Popular Games */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Star size={20} className="mr-2 text-primary" />
            Populära Lekar
          </h2>

          {popularGames.map((game) => (
            <Card key={game.id} className="p-4 glass card-shadow relative overflow-hidden hover:scale-[1.02] transition-transform">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-lg" />
              
              <div className="relative space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{game.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {game.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(game.difficulty)} text-white text-xs`}>
                        {game.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{game.rating}</span>
                  </div>
                </div>

                {/* Game Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-primary" />
                    <span>{game.players}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-secondary" />
                    <span>{game.duration}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {game.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Spelad {game.played} gånger</span>
                  <div className="flex items-center space-x-1">
                    <Gamepad2 size={12} />
                    <span>Populär denna vecka</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-2">
                  <Button className="flex-1 gradient-primary text-white button-shadow">
                    <Play size={16} className="mr-2" />
                    Starta Lek
                  </Button>
                  <Button variant="outline" size="icon" className="glass">
                    <Star size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Custom Game */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative text-center text-white">
            <Gamepad2 size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Skapa Din Egen Lek</h3>
            <p className="text-sm opacity-80 mb-4">
              Anpassa lekar efter din grupp och situation!
            </p>
            <Button variant="secondary" className="bg-white/20 backdrop-blur text-white border-white/20 hover:bg-white/30">
              Kom Igång
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}