import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClickableAvatar } from "@/components/profile/ClickableAvatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DirectConversation {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  other_user: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    profile_pictures?: string[];
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
}

export function ChatView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all conversations where user is participant
      const { data: convData, error: convError } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (convError) throw convError;

      if (!convData || convData.length === 0) {
        setConversations([]);
        return;
      }

      // Get other user IDs
      const otherUserIds = convData.map(conv => 
        conv.user_a === user.id ? conv.user_b : conv.user_a
      );

      // Fetch profiles for other users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, profile_pictures')
        .in('user_id', otherUserIds);

      if (profilesError) throw profilesError;

      // Fetch last messages for each conversation
      const { data: lastMessages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('conversation_id, content, sender_id, created_at')
        .in('conversation_id', convData.map(c => c.id))
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unread message counts
      const unreadCounts = await Promise.all(
        convData.map(async (conv) => {
          const { count, error } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          if (error) {
            console.error('Error counting unread messages:', error);
            return { conversationId: conv.id, count: 0 };
          }

          return { conversationId: conv.id, count: count || 0 };
        })
      );

      // Create profile map
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      // Create last message map
      const lastMessageMap = new Map();
      (lastMessages || []).forEach(msg => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg);
        }
      });

      // Create unread count map
      const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u.count]));

      // Combine all data
      const conversationsWithData: DirectConversation[] = convData.map(conv => {
        const otherUserId = conv.user_a === user.id ? conv.user_b : conv.user_a;
        const profile = profileMap.get(otherUserId);
        const lastMessage = lastMessageMap.get(conv.id);
        const unreadCount = unreadMap.get(conv.id) || 0;

        return {
          ...conv,
          other_user: {
            user_id: otherUserId,
            display_name: profile?.display_name || null,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            profile_pictures: profile?.profile_pictures || []
          },
          last_message: lastMessage || null,
          unread_count: unreadCount
        };
      });

      setConversations(conversationsWithData);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte ladda chattar",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.other_user.display_name || conv.other_user.username || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Nu";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('sv-SE');
  };

  const openConversation = (conversationId: string, otherUserId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Chattar
          </h1>
          {totalUnread > 0 && (
            <Badge className="gradient-primary text-white">
              {totalUnread} nya
            </Badge>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Sök chattar..."
            className="pl-10 glass border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
              {conversations.length}
            </p>
            <p className="text-xs text-muted-foreground">Chattar</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-secondary bg-clip-text text-transparent">
              {conversations.filter(c => c.last_message_at).length}
            </p>
            <p className="text-xs text-muted-foreground">Aktiva</p>
          </Card>
          <Card className="p-3 glass text-center">
            <p className="text-lg font-bold gradient-accent bg-clip-text text-transparent">
              {totalUnread}
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

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
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
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                className="p-4 glass card-shadow hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => openConversation(conversation.id, conversation.other_user.user_id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <ClickableAvatar
                      src={conversation.other_user.avatar_url}
                      fallback={(conversation.other_user.display_name || conversation.other_user.username || 'U').charAt(0).toUpperCase()}
                      userName={conversation.other_user.display_name || conversation.other_user.username || 'Okänd användare'}
                      profilePictures={conversation.other_user.profile_pictures || []}
                      className="w-12 h-12 border-2 border-border/20"
                    />
                    {conversation.unread_count > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center p-0 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">
                        {conversation.other_user.display_name || conversation.other_user.username || 'Okänd'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate ${
                      conversation.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {conversation.last_message 
                        ? conversation.last_message.content 
                        : "Ingen konversation än"}
                    </p>

                    {conversation.other_user.username && (
                      <div className="text-xs text-muted-foreground mt-1">
                        @{conversation.other_user.username}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 glass card-shadow text-center">
              <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Inga chattar än</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Börja chatta med dina vänner genom att trycka på chat-ikonen bredvid dem!
              </p>
              <Button 
                className="gradient-primary text-white"
                onClick={() => navigate('/groups')}
              >
                Gå till Vänner
              </Button>
            </Card>
          )}
        </div>

        {/* Chat Tips */}
        <Card className="p-6 glass card-shadow gradient-hero relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-lg" />
          <div className="relative text-center text-white">
            <MessageCircle size={32} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold mb-2">Direktmeddelanden</h3>
            <p className="text-sm opacity-80 mb-4">
              Chatta direkt med dina vänner i realtid!
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