import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Gamepad2, Users, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
}

export function GamesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', 
          await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .then(res => res.data?.map(item => item.group_id) || [])
        );

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const startNeverHaveIEverGame = () => {
    if (selectedGroups.length === 0) {
      toast({
        title: "Välj grupper",
        description: "Du måste välja minst en grupp för att starta leken.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implementera själva spelet
    toast({
      title: "Spelet startar!",
      description: `Jag har aldrig med ${selectedGroups.length} grupp(er)`,
    });
    setShowGroupSelector(false);
    setSelectedGroups([]);
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Festlekar
          </h1>
        </div>

        {/* Jag har aldrig - Main Game */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative text-center text-white">
            <Gamepad2 size={48} className="mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-3">Jag har aldrig</h2>
            <p className="text-sm opacity-90 mb-6">
              Den klassiska leken där ni lär känna varandra bättre!
            </p>
            
            <div className="flex items-center justify-center space-x-4 mb-6 text-sm opacity-80">
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>3+ spelare</span>
              </div>
              <div className="text-white/60">•</div>
              <span>15-30 min</span>
            </div>

            <Dialog open={showGroupSelector} onOpenChange={setShowGroupSelector}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="bg-white/20 backdrop-blur text-white border-white/20 hover:bg-white/30 px-8"
                >
                  <Play size={20} className="mr-2" />
                  Starta Lek
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Välj grupper som ska spela</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Du är inte medlem i några grupper än. Gå till Vänner för att skapa eller gå med i grupper.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={group.id}
                            checked={selectedGroups.includes(group.id)}
                            onCheckedChange={() => toggleGroupSelection(group.id)}
                          />
                          <label 
                            htmlFor={group.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {group.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {groups.length > 0 && (
                    <div className="flex space-x-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowGroupSelector(false)}
                        className="flex-1"
                      >
                        Avbryt
                      </Button>
                      <Button 
                        onClick={startNeverHaveIEverGame}
                        className="flex-1 gradient-primary"
                        disabled={selectedGroups.length === 0}
                      >
                        Starta
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* How to Play */}
        <Card className="p-4 glass card-shadow">
          <h3 className="font-semibold mb-3 flex items-center">
            <Gamepad2 size={20} className="mr-2 text-primary" />
            Så spelar du
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Alla börjar med 5 fingrar uppe</p>
            <p>2. En person säger "Jag har aldrig..." + något de aldrig gjort</p>
            <p>3. Alla som HAR gjort det sänker ett finger</p>
            <p>4. Första att sänka alla fingrar förlorar!</p>
          </div>
        </Card>

        {/* Coming Soon */}
        <Card className="p-4 glass card-shadow opacity-60">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Fler lekar kommer snart!</h3>
            <p className="text-sm text-muted-foreground">
              Vi jobbar på att lägga till fler roliga festlekar.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}