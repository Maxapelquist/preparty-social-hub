import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClickableAvatar } from "@/components/profile/ClickableAvatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Calendar, MapPin, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string;
  age: number;
  bio: string;
  university: string;
  interests: string[];
  location_name: string;
  avatar_url: string;
  profile_pictures: string[];
}

export default function FriendProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !user) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, age, bio, university, interests, location_name, avatar_url, profile_pictures')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            variant: "destructive",
            title: "Profil ej hittad",
            description: "Denna användare kunde inte hittas"
          });
          navigate('/');
          return;
        }

        setProfile(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Kunde inte ladda profil",
          description: error.message
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user, toast, navigate]);

  const handleMessage = () => {
    // Navigate to direct message with this user
    navigate(`/dm/${userId}`);
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

  if (!profile) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto text-center">
          <p className="text-muted-foreground">Kunde inte ladda profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="glass"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Profil
          </h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {/* Profile Card */}
        <Card className="p-6 card-shadow glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 gradient-hero opacity-10 rounded-full blur-2xl" />
          
          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <ClickableAvatar
                src={profile.avatar_url}
                fallback={profile.display_name?.charAt(0).toUpperCase() || 'U'}
                userName={profile.display_name || 'Okänd användare'}
                profilePictures={profile.profile_pictures || []}
                className="w-24 h-24 border-4 border-primary/20"
                size="lg"
              />
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
                <p className="text-2xl font-bold">-</p>
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
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Fester</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            className="w-full gradient-primary text-white button-shadow h-12"
            onClick={handleMessage}
          >
            <MessageCircle size={18} className="mr-2" />
            Skicka Meddelande
          </Button>
          
          {profile.location_name && (
            <Button variant="outline" className="w-full glass" disabled>
              <MapPin size={18} className="mr-2" />
              {profile.location_name}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}