import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Users, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ChatView() {
  const conversations = [
    {
      id: 1,
      groupName: "KTH Crew → Söder Squad",
      type: "group-request",
      lastMessage: "Hej! Vi skulle vilja joina er fest ikväll 🎉",
      time: "5 min",
      unread: 2,
      status: "pending",
      avatar: "K"
    },
    {
      id: 2,
      groupName: "Music Lovers Chat",
      type: "group-chat",
      lastMessage: "Vilken typ av musik kommer spelas?",
      time: "1h",
      unread: 0,
      status: "active",
      avatar: "M"
    },
    {
      id: 3,
      groupName: "Rooftop Vibes → KTH Crew",
      type: "party-invite",
      lastMessage: "Ni är välkomna till vår rooftop fest!",
      time: "2h",
      unread: 1,
      status: "invited",
      avatar: "R"
    },
    {
      id: 4,
      groupName: "Game Night Gang",
      type: "group-chat",
      lastMessage: "Tack för en fantastisk kväll!",
      time: "1d",
      unread: 0,
      status: "active",
      avatar: "G"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "gradient-secondary";
      case "invited": return "gradient-primary";
      case "active": return "gradient-accent";
      default: return "gradient-primary";
    }
  };

  const getStatusText = (status: string, type: string) => {
    if (type === "group-request") return "Förfrågan";
    if (type === "party-invite") return "Inbjudan";
    return "Aktiv";
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Chattar
          </h1>
          <Badge className="gradient-primary text-white">
            {conversations.filter(c => c.unread > 0).length} nya
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Sök chattar..."
            className="pl-10 glass border-border/50"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
              {conversations.filter(c => c.type === "group-request").length}
            </p>
            <p className="text-xs text-muted-foreground">Förfrågningar</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-secondary bg-clip-text text-transparent">
              {conversations.filter(c => c.type === "group-chat").length}
            </p>
            <p className="text-xs text-muted-foreground">Gruppchatter</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-accent bg-clip-text text-transparent">
              {conversations.filter(c => c.unread > 0).reduce((sum, c) => sum + c.unread, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Olästa</p>
          </Card>
        </div>

        {/* Conversations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MessageCircle size={20} className="mr-2 text-primary" />
            Konversationer
          </h2>

          {conversations.map((conversation) => (
            <Card key={conversation.id} className="p-4 glass card-shadow hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-12 h-12 border-2 border-border/20">
                    <AvatarFallback className={`${getStatusColor(conversation.status)} text-white font-bold`}>
                      {conversation.avatar}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unread > 0 && (
                    <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center p-0 text-xs">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{conversation.groupName}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(conversation.status)} text-white text-xs`}
                      >
                        {getStatusText(conversation.status, conversation.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{conversation.time}</span>
                    </div>
                  </div>
                  
                  <p className={`text-sm truncate ${
                    conversation.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {conversation.lastMessage}
                  </p>

                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    {conversation.type === "group-request" && (
                      <>
                        <Users size={12} className="mr-1" />
                        <span>Gruppförfrågan</span>
                      </>
                    )}
                    {conversation.type === "party-invite" && (
                      <>
                        <Clock size={12} className="mr-1" />
                        <span>Festinbjudan</span>
                      </>
                    )}
                    {conversation.type === "group-chat" && (
                      <>
                        <MessageCircle size={12} className="mr-1" />
                        <span>Gruppchatt</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* No Chats State */}
        {conversations.length === 0 && (
          <Card className="p-8 glass card-shadow text-center">
            <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Inga chattar än</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Skicka förfrågningar till andra grupper för att börja chatta!
            </p>
            <Button className="gradient-primary text-white">
              Hitta Grupper
            </Button>
          </Card>
        )}

        {/* Chat Tips */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg" />
          <div className="relative text-center text-white">
            <MessageCircle size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Smart Chatt</h3>
            <p className="text-sm opacity-80 mb-4">
              Automatiska översättningar och föreslagna svar för bättre kommunikation!
            </p>
            <Button variant="secondary" className="bg-white/20 backdrop-blur text-white border-white/20 hover:bg-white/30">
              Läs Mer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}