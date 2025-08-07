import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Crown, MessageCircle, MapPin, Clock } from "lucide-react";

export function GroupsView() {
  const myGroups = [
    {
      id: 1,
      name: "KTH Crew",
      members: 5,
      isAdmin: true,
      avatar: "K",
      lastActivity: "Aktiv nu",
      status: "Söker fest"
    },
    {
      id: 2,
      name: "Södermalm Squad",
      members: 3,
      isAdmin: false,
      avatar: "S",
      lastActivity: "2h sedan",
      status: "På fest"
    }
  ];

  const suggestions = [
    {
      id: 3,
      name: "Music Lovers",
      members: 7,
      mutualFriends: 2,
      avatar: "M",
      distance: "500m"
    },
    {
      id: 4,
      name: "Game Night Gang",
      members: 4,
      mutualFriends: 1,
      avatar: "G",
      distance: "1.2km"
    }
  ];

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Grupper & Vänner
          </h1>
          <Button className="gradient-primary text-white button-shadow">
            <Plus size={20} className="mr-2" />
            Ny Grupp
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="glass h-16 flex-col">
            <Users size={20} className="mb-1" />
            <span className="text-xs">Hitta Vänner</span>
          </Button>
          <Button variant="outline" className="glass h-16 flex-col">
            <MessageCircle size={20} className="mb-1" />
            <span className="text-xs">Skapa Chatt</span>
          </Button>
        </div>

        {/* My Groups */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Users size={20} className="mr-2 text-primary" />
            Mina Grupper
          </h2>

          {myGroups.map((group) => (
            <Card key={group.id} className="p-4 glass card-shadow">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="gradient-primary text-white font-bold">
                      {group.avatar}
                    </AvatarFallback>
                  </Avatar>
                  {group.isAdmin && (
                    <Crown size={14} className="absolute -top-1 -right-1 text-yellow-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{group.name}</h3>
                    <Badge 
                      variant="secondary" 
                      className={
                        group.status === "Söker fest" 
                          ? "gradient-primary text-white" 
                          : "gradient-secondary text-white"
                      }
                    >
                      {group.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Users size={14} className="mr-1" />
                      {group.members} medlemmar
                    </span>
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {group.lastActivity}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="icon" className="glass">
                  <MessageCircle size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Suggested Groups */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MapPin size={20} className="mr-2 text-accent" />
            Föreslagna Grupper
          </h2>

          {suggestions.map((group) => (
            <Card key={group.id} className="p-4 glass card-shadow">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12 border-2 border-accent/20">
                  <AvatarFallback className="gradient-accent text-white font-bold">
                    {group.avatar}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{group.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Users size={14} className="mr-1" />
                      {group.members} medlemmar
                    </span>
                    <span>{group.mutualFriends} gemensamma vänner</span>
                    <span className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {group.distance}
                    </span>
                  </div>
                </div>

                <Button variant="outline" className="glass">
                  Följ
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Group CTA */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg" />
          <div className="relative text-center text-white">
            <Users size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Skapa Din Första Grupp</h3>
            <p className="text-sm opacity-80 mb-4">
              Samla dina vänner och börja hitta häftiga fester tillsammans!
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