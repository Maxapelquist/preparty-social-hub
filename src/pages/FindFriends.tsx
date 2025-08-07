import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, UserPlus, Users, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  university: string;
  interests: string[];
  bio: string;
}

function FindFriends() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchNearbyProfiles();
  }, [user, navigate]);

  const fetchNearbyProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user!.id)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda profiler",
        description: error.message
      });
    }
  };

  const searchProfiles = async () => {
    if (!searchTerm.trim()) {
      fetchNearbyProfiles();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user!.id)
        .or(`display_name.ilike.%${searchTerm}%,university.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sökning misslyckades",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string, displayName: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user!.id,
          friend_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      setSentRequests(prev => [...prev, targetUserId]);
      
      toast({
        title: "Vänförfrågan skickad!",
        description: `Förfrågan har skickats till ${displayName}`
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte skicka förfrågan",
        description: error.message
      });
    }
  };

  const getInterestColor = (index: number) => {
    const colors = ['gradient-primary', 'gradient-secondary', 'gradient-accent'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Hitta Vänner
          </h1>
        </div>

        {/* Search */}
        <Card className="p-4 glass card-shadow">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Sök efter namn eller universitet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && searchProfiles()}
              />
            </div>
            <Button 
              onClick={searchProfiles}
              className="gradient-primary text-white"
              disabled={loading}
            >
              {loading ? '...' : 'Sök'}
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 glass card-shadow text-center">
            <p className="text-lg font-bold text-primary">{searchResults.length}</p>
            <p className="text-xs text-muted-foreground">Hittade personer</p>
          </Card>
          <Card className="p-3 glass card-shadow text-center">
            <p className="text-lg font-bold text-secondary">{sentRequests.length}</p>
            <p className="text-xs text-muted-foreground">Skickade förfrågningar</p>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Users size={20} className="mr-2 text-primary" />
            {searchTerm ? 'Sökresultat' : 'Personer i närheten'}
          </h2>

          {searchResults.length > 0 ? (
            searchResults.map((profile) => (
              <Card key={profile.id} className="p-4 glass card-shadow">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16 border-2 border-primary/20">
                    <AvatarFallback className="gradient-primary text-white text-lg font-bold">
                      {profile.display_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-bold text-lg">{profile.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.age && `${profile.age} år`}
                        {profile.age && profile.university && ' • '}
                        {profile.university}
                      </p>
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-muted-foreground">
                        {profile.bio.length > 80 ? `${profile.bio.slice(0, 80)}...` : profile.bio}
                      </p>
                    )}

                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.interests.slice(0, 3).map((interest, index) => (
                          <Badge 
                            key={interest} 
                            variant="secondary" 
                            className={`text-white text-xs ${getInterestColor(index)}`}
                          >
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      {sentRequests.includes(profile.user_id) ? (
                        <Button variant="outline" disabled className="flex-1">
                          Förfrågan skickad
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 gradient-primary text-white"
                          onClick={() => sendFriendRequest(profile.user_id, profile.display_name)}
                        >
                          <UserPlus size={16} className="mr-2" />
                          Lägg till vän
                        </Button>
                      )}
                      
                      <Button variant="outline" size="icon" className="glass">
                        <MessageCircle size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 glass card-shadow text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full gradient-hero opacity-20 flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {searchTerm ? 'Inga resultat hittades' : 'Inga personer i närheten'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? 'Prova att söka efter något annat' 
                      : 'Kom tillbaka senare för att se nya personer'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindFriends;