import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, MapPin, Clock, Users, Star, Navigation, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PartiesView() {
  const nearbyParties = [
    {
      id: 1,
      title: "Förfest Södermalm",
      hostGroup: "Söder Squad",
      location: "Södermalm, 200m",
      time: "19:00 - 22:00",
      attendees: 12,
      maxAttendees: 20,
      description: "Chill förfest innan vi drar vidare till klubben!",
      vibe: "Chill",
      isJoined: false
    },
    {
      id: 2,
      title: "KTH Pre-Game",
      hostGroup: "Tech Crew",
      location: "Östermalm, 800m",
      time: "20:00 - 23:00",
      attendees: 8,
      maxAttendees: 15,
      description: "Teknikstudenter som värmer upp för natten!",
      vibe: "Energetic",
      isJoined: true
    },
    {
      id: 3,
      title: "Rooftop Vibes",
      hostGroup: "Sky High",
      location: "Norrmalm, 1.2km",
      time: "18:30 - 21:30",
      attendees: 15,
      maxAttendees: 25,
      description: "Takvåning med utsikt över Stockholm 🌆",
      vibe: "Luxury",
      isJoined: false
    }
  ];

  const getVibeColor = (vibe: string) => {
    switch (vibe) {
      case "Chill": return "gradient-accent";
      case "Energetic": return "gradient-primary";
      case "Luxury": return "gradient-secondary";
      default: return "gradient-primary";
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Fester Runt Dig
          </h1>
          <Button className="gradient-primary text-white button-shadow">
            <Plus size={20} className="mr-2" />
            Skapa
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Sök fester..."
              className="pl-10 glass border-border/50"
            />
          </div>
          <Button variant="outline" size="icon" className="glass">
            <Filter size={18} />
          </Button>
        </div>

        {/* Map View Toggle */}
        <Card className="p-4 glass card-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 gradient-accent rounded-lg">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold">Kartvy</p>
                <p className="text-sm text-muted-foreground">Se fester på karta</p>
              </div>
            </div>
            <Button variant="outline" className="glass">
              <Navigation size={16} className="mr-2" />
              Öppna
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
              {nearbyParties.length}
            </p>
            <p className="text-xs text-muted-foreground">Aktiva fester</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-secondary bg-clip-text text-transparent">
              1.5km
            </p>
            <p className="text-xs text-muted-foreground">Genomsnitt</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-accent bg-clip-text text-transparent">
              35
            </p>
            <p className="text-xs text-muted-foreground">Deltagare</p>
          </Card>
        </div>

        {/* Party List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Star size={20} className="mr-2 text-primary" />
            Fester i Närheten
          </h2>

          {nearbyParties.map((party) => (
            <Card key={party.id} className="p-4 glass card-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-lg" />
              
              <div className="relative space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{party.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Värd: {party.hostGroup}
                    </p>
                  </div>
                  <Badge className={`${getVibeColor(party.vibe)} text-white`}>
                    {party.vibe}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-accent" />
                    <span>{party.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-secondary" />
                    <span>{party.time}</span>
                  </div>
                </div>

                {/* Attendees */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-primary" />
                    <span className="text-sm">
                      {party.attendees}/{party.maxAttendees} deltagare
                    </span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="gradient-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${(party.attendees / party.maxAttendees) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {party.description}
                </p>

                {/* Actions */}
                <div className="flex space-x-3 pt-2">
                  {party.isJoined ? (
                    <Button className="flex-1 gradient-secondary text-white">
                      <MessageCircle size={16} className="mr-2" />
                      Chatta
                    </Button>
                  ) : (
                    <Button className="flex-1 gradient-primary text-white button-shadow">
                      Skicka Förfrågan
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="glass">
                    <Star size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Party CTA */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative text-center text-white">
            <MapPin size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Skapa Din Egen Fest</h3>
            <p className="text-sm opacity-80 mb-4">
              Bjud in andra grupper och skapa minnesvärda stunder!
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