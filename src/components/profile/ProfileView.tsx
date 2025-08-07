import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit3, Users, Calendar, MapPin, Star } from "lucide-react";

export function ProfileView() {
  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Min Profil
          </h1>
          <Button variant="outline" size="icon" className="glass">
            <Settings size={20} />
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="p-6 card-shadow glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-hero opacity-10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  A
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute -bottom-2 -right-2 w-8 h-8 gradient-primary button-shadow"
              >
                <Edit3 size={14} />
              </Button>
            </div>

            <div>
              <h2 className="text-xl font-bold">Anna Andersson</h2>
              <p className="text-muted-foreground">21 år • KTH Student</p>
            </div>

            <p className="text-sm text-muted-foreground max-w-xs">
              Gillar att träffa nya människor och ha kul! Alltid redo för spontana äventyr 🎉
            </p>

            {/* Interests */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="gradient-secondary text-white">
                🎵 Musik
              </Badge>
              <Badge variant="secondary" className="gradient-accent text-white">
                🎮 Gaming
              </Badge>
              <Badge variant="secondary" className="gradient-primary text-white">
                🍕 Mat
              </Badge>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 glass card-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 gradient-primary rounded-lg">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Vänner</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 glass card-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 gradient-secondary rounded-lg">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Fester</p>
              </div>
            </div>
          </Card>
        </div>


        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full gradient-primary text-white button-shadow h-12">
            Redigera Profil
          </Button>
          <Button variant="outline" className="w-full glass">
            <MapPin size={18} className="mr-2" />
            Uppdatera Plats
          </Button>
        </div>
      </div>
    </div>
  );
}