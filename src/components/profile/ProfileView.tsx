import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit3, Users, Calendar, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Onboarding from "@/pages/Onboarding";

interface Profile {
  display_name: string;
  age: number;
  bio: string;
  university: string;
  occupation: string;
  interests: string[];
  location_name: string;
}

export function ProfileView() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, age, bio, university, occupation, interests, location_name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('Profile error:', error);
        // User doesn't have a profile yet, will show onboarding
        setProfile(null);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Utloggad",
      description: "Du har loggats ut från PreParty"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile is complete
  const isProfileComplete = profile && profile.display_name && profile.age && profile.occupation;

  // Show onboarding if profile is incomplete
  if (!isProfileComplete) {
    return <Onboarding canSkip={true} />;
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Min Profil
          </h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" className="glass">
              <Settings size={20} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="glass"
              onClick={handleSignOut}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="p-6 card-shadow glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-hero opacity-10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {profile.display_name?.charAt(0).toUpperCase() || 'U'}
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
              <h2 className="text-xl font-bold">{profile.display_name}</h2>
              <p className="text-muted-foreground">
                {profile.age} år {profile.university && `• ${profile.university}`}
              </p>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground max-w-xs">
                {profile.bio}
              </p>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {profile.interests.map((interest, index) => (
                  <Badge 
                    key={interest} 
                    variant="secondary" 
                    className={`text-white ${
                      index % 3 === 0 ? 'gradient-primary' : 
                      index % 3 === 1 ? 'gradient-secondary' : 
                      'gradient-accent'
                    }`}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
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
          <Button 
            className="w-full gradient-primary text-white button-shadow h-12"
            onClick={() => navigate('/profile/edit')}
          >
            Redigera Profil
          </Button>
          {profile.location_name ? (
            <Button variant="outline" className="w-full glass">
              <MapPin size={18} className="mr-2" />
              {profile.location_name}
            </Button>
          ) : (
            <Button variant="outline" className="w-full glass">
              <MapPin size={18} className="mr-2" />
              Lägg till Plats
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}