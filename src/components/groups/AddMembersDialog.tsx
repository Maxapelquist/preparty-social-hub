import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Friend {
  id: string;
  display_name: string;
  user_id: string;
}

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onMembersAdded: () => void;
}

export function AddMembersDialog({ 
  open, 
  onOpenChange, 
  groupId, 
  groupName, 
  onMembersAdded 
}: AddMembersDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      fetchAvailableFriends();
    }
  }, [open, user, groupId]);

  const fetchAvailableFriends = async () => {
    setLoading(true);
    try {
      // Get all accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendsData.map(f => f.friend_id);

      // Get current group members to exclude them
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const currentMemberIds = membersData?.map(m => m.user_id) || [];

      // Filter out friends who are already members
      const availableFriendIds = friendIds.filter(id => !currentMemberIds.includes(id));

      if (availableFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Get profiles for available friends
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', availableFriendIds);

      if (profilesError) throw profilesError;

      const friendsList = profilesData?.map(profile => ({
        id: profile.user_id,
        display_name: profile.display_name || 'Okänd användare',
        user_id: profile.user_id
      })) || [];

      setFriends(friendsList);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda vänner",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;

    setSubmitting(true);
    try {
      const memberInserts = selectedFriends.map(friendId => ({
        group_id: groupId,
        user_id: friendId,
        role: 'member'
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (error) throw error;

      toast({
        title: "Medlemmar tillagda!",
        description: `${selectedFriends.length} medlem${selectedFriends.length > 1 ? 'mar' : ''} tillagd${selectedFriends.length > 1 ? 'a' : ''} till ${groupName}.`
      });

      onMembersAdded();
      onOpenChange(false);
      setSelectedFriends([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte lägga till medlemmar",
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lägg till medlemmar i {groupName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-6">
              <Users size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Inga tillgängliga vänner att lägga till
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <div 
                    key={friend.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <Checkbox
                      checked={selectedFriends.includes(friend.id)}
                      onCheckedChange={() => toggleFriend(friend.id)}
                    />
                    
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="gradient-primary text-white text-sm">
                        {friend.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{friend.display_name}</p>
                    </div>

                    {selectedFriends.includes(friend.id) && (
                      <Check size={16} className="text-primary" />
                    )}
                  </div>
                ))}
              </div>

              {selectedFriends.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedFriends.length} medlem{selectedFriends.length > 1 ? 'mar' : ''} vald{selectedFriends.length > 1 ? 'a' : ''}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleAddMembers}
            disabled={selectedFriends.length === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Lägger till...
              </>
            ) : (
              `Lägg till (${selectedFriends.length})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}