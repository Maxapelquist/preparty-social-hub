import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GroupMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupInfo {
  id: string;
  name: string;
  member_count: number;
}

function GroupChat() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !groupId) {
      navigate(-1);
      return;
    }
    
    initializeGroupChat();
  }, [user, groupId, navigate]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeGroupChat = async () => {
    try {
      // Verify user is member of the group and get group info
      const { data: membership, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id)
        .eq('group_id', groupId!)
        .single();

      if (memberError || !membership) {
        toast({
          variant: "destructive",
          title: "Åtkomst nekad",
          description: "Du är inte medlem i denna grupp"
        });
        navigate(-1);
        return;
      }

      // Get group info
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('id', groupId!)
        .single();

      if (groupError || !group) {
        toast({
          variant: "destructive",
          title: "Grupp inte hittad",
          description: "Gruppen finns inte eller har tagits bort"
        });
        navigate(-1);
        return;
      }

      // Get member count
      const { data: members, error: countError } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId!);

      if (countError) throw countError;

      setGroupInfo({
        id: group.id,
        name: group.name,
        member_count: members?.length || 0
      });

      // Check if group conversation exists
      const { data: existingConv, error: convError } = await supabase
        .from('group_conversations')
        .select('id')
        .eq('group_id', groupId!)
        .maybeSingle();

      if (convError) throw convError;

      if (existingConv) {
        setConversationId(existingConv.id);
      } else {
        // Create new group conversation
        const { data: newConv, error: createError } = await supabase
          .from('group_conversations')
          .insert({
            group_id: groupId!
          })
          .select('id')
          .single();

        if (createError) throw createError;
        setConversationId(newConv.id);
      }
    } catch (error: any) {
      console.error('Error initializing group chat:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte starta gruppchatt",
        description: error.message
      });
      navigate(-1);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(data.map(msg => msg.sender_id))];
      
      // Fetch profiles for all senders
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        sender: {
          display_name: profileMap.get(msg.sender_id)?.display_name || null,
          avatar_url: profileMap.get(msg.sender_id)?.avatar_url || null
        }
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte ladda meddelanden",
        description: error.message
      });
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel('group-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const formattedMessage: GroupMessage = {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            sender_id: newMessage.sender_id,
            sender: {
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null
            }
          };

          setMessages(prev => [...prev, formattedMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte skicka meddelande",
        description: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!groupInfo) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto">
          <p className="text-center text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-4">
        <div className="max-w-md mx-auto flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{groupInfo.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center">
              <Users size={14} className="mr-1" />
              {groupInfo.member_count} medlemmar
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.sender_id === user?.id 
                    ? 'flex-row-reverse' 
                    : 'flex-row'
                } space-x-2`}
              >
                {message.sender_id !== user?.id && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage 
                      src={message.sender.avatar_url || undefined} 
                      className="object-cover" 
                    />
                    <AvatarFallback className="gradient-primary text-white text-xs">
                      {(message.sender.display_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground ml-2'
                      : 'bg-muted mr-2'
                  } px-3 py-2 rounded-lg`}
                >
                  {message.sender_id !== user?.id && (
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {message.sender.display_name || 'Okänd användare'}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id 
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv ett meddelande..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="gradient-primary text-white"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GroupChat;