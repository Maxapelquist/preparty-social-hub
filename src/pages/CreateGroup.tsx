import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  display_name: string;
  user_id: string;
}

function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedFriends: [] as string[]
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFriends();
  }, [user, navigate]);

  const fetchFriends = async () => {
    // For now, we'll use mock data since friends system isn't fully implemented
    // In a real app, this would fetch actual friends from the database
    const mockFriends = [
      { id: '1', display_name: 'Anna Svensson', user_id: 'user1' },
      { id: '2', display_name: 'Erik Johansson', user_id: 'user2' },
      { id: '3', display_name: 'Maria Lindqvist', user_id: 'user3' },
      { id: '4', display_name: 'Johan Andersson', user_id: 'user4' }
    ];
    setFriends(mockFriends);
  };

  const toggleFriend = (friendId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFriends: prev.selectedFriends.includes(friendId)
        ? prev.selectedFriends.filter(id => id !== friendId)
        : [...prev.selectedFriends, friendId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Gruppnamn krävs",
        description: "Ange ett namn för gruppen"
      });
      return;
    }

    setLoading(true);

    try {
      // For now, just simulate group creation
      // In a real app, this would save to the groups table
      toast({
        title: "Grupp skapad!",
        description: `${formData.name} har skapats framgångsrikt.`
      });

      navigate('/groups');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte skapa grupp",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
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
            Skapa Grupp
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Group Info */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Gruppinformation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Gruppnamn</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="t.ex. KTH Crew"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Beskrivning (valfritt)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv er grupp..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Select Friends */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Lägg till medlemmar</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Välj vänner att bjuda in till gruppen
            </p>
            
            <div className="space-y-3">
              {friends.map((friend) => (
                <div 
                  key={friend.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleFriend(friend.id)}
                >
                  <Checkbox
                    checked={formData.selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                  />
                  
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="gradient-primary text-white">
                      {friend.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <p className="font-medium">{friend.display_name}</p>
                  </div>

                  {formData.selectedFriends.includes(friend.id) && (
                    <Check size={16} className="text-primary" />
                  )}
                </div>
              ))}

              {friends.length === 0 && (
                <div className="text-center py-6">
                  <Users size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Du har inga vänner att lägga till än
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => navigate('/friends')}
                  >
                    Hitta vänner
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Selected Members Preview */}
          {formData.selectedFriends.length > 0 && (
            <Card className="p-4 glass card-shadow">
              <h3 className="font-medium mb-3">
                Valda medlemmar ({formData.selectedFriends.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.selectedFriends.map(friendId => {
                  const friend = friends.find(f => f.id === friendId);
                  return friend ? (
                    <div key={friendId} className="flex items-center space-x-2 bg-primary/10 rounded-full px-3 py-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs gradient-primary text-white">
                          {friend.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{friend.display_name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-white button-shadow h-12"
            disabled={loading}
          >
            <Users size={18} className="mr-2" />
            {loading ? 'Skapar grupp...' : 'Skapa grupp'}
          </Button>

        </form>
      </div>
    </div>
  );
}

export default CreateGroup;