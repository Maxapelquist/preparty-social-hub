import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Crown, MessageCircle, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description?: string;
  admin_id: string;
  member_count: number;
  is_admin: boolean;
  created_at: string;
}

export function GroupsView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggestions, setSuggestions] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyGroups();
      fetchSuggestedGroups();
    }
  }, [user]);

  const fetchMyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups (
            id,
            name,
            description,
            admin_id,
            created_at
          )
        `)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Get member counts for each group
      const groupIds = data?.map(item => item.group_id) || [];
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      if (countError) throw countError;

      const groupsWithCounts = data?.map(item => {
        const memberCount = memberCounts?.filter(m => m.group_id === item.group_id).length || 0;
        return {
          id: item.groups?.id || '',
          name: item.groups?.name || '',
          description: item.groups?.description,
          admin_id: item.groups?.admin_id || '',
          member_count: memberCount,
          is_admin: item.role === 'admin',
          created_at: item.groups?.created_at || ''
        };
      }) || [];

      setMyGroups(groupsWithCounts);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda grupper",
        description: error.message
      });
    }
  };

  const fetchSuggestedGroups = async () => {
    try {
      // Get groups the user is not a member of
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      const userGroupIds = userGroups?.map(g => g.group_id) || [];

      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description, admin_id, created_at')
        .not('id', 'in', `(${userGroupIds.join(',')})`)
        .limit(5);

      if (error) throw error;

      // Get member counts for suggested groups
      const groupIds = data?.map(group => group.id) || [];
      const { data: memberCounts } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      const suggestedWithCounts = data?.map(group => {
        const memberCount = memberCounts?.filter(m => m.group_id === group.id).length || 0;
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          admin_id: group.admin_id,
          member_count: memberCount,
          is_admin: false,
          created_at: group.created_at
        };
      }) || [];

      setSuggestions(suggestedWithCounts);
    } catch (error: any) {
      console.error('Error fetching suggested groups:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Grupper & Vänner
          </h1>
          <Button 
            className="gradient-primary text-white button-shadow"
            onClick={() => window.location.href = '/groups/create'}
          >
            <Plus size={20} className="mr-2" />
            Ny Grupp
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="glass h-16 flex-col"
            onClick={() => window.location.href = '/friends'}
          >
            <Users size={20} className="mb-1" />
            <span className="text-xs">Hitta Vänner</span>
          </Button>
          <Button 
            variant="outline" 
            className="glass h-16 flex-col"
            onClick={() => window.location.href = '/chat'}
          >
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

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="p-4 glass card-shadow animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : myGroups.length > 0 ? (
            myGroups.map((group) => (
              <Card key={group.id} className="p-4 glass card-shadow">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="gradient-primary text-white font-bold">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {group.is_admin && (
                      <Crown size={14} className="absolute -top-1 -right-1 text-yellow-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{group.name}</h3>
                      <Badge variant="secondary" className="gradient-primary text-white">
                        Aktiv
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {group.member_count} medlemmar
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {new Date(group.created_at).toLocaleDateString('sv')}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" size="icon" className="glass">
                    <MessageCircle size={16} />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 glass card-shadow text-center">
              <Users size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Du är inte medlem i några grupper än</p>
            </Card>
          )}
        </div>

        {/* Suggested Groups */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center">
            <MapPin size={20} className="mr-2 text-accent" />
            Föreslagna Grupper
          </h2>

          {suggestions.length > 0 ? (
            suggestions.map((group) => (
              <Card key={group.id} className="p-4 glass card-shadow">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12 border-2 border-accent/20">
                    <AvatarFallback className="gradient-accent text-white font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{group.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" />
                        {group.member_count} medlemmar
                      </span>
                      <span className="text-xs">
                        {new Date(group.created_at).toLocaleDateString('sv')}
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="glass">
                    Gå med
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 glass card-shadow text-center">
              <MapPin size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Inga föreslagna grupper just nu</p>
            </Card>
          )}
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
            <Button 
              variant="secondary" 
              className="bg-white/20 backdrop-blur text-white border-white/20 hover:bg-white/30"
              onClick={() => window.location.href = '/groups/create'}
            >
              Kom Igång
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}