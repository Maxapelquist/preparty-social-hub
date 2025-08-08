import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClickableAvatar } from "@/components/profile/ClickableAvatar";
import { ArrowLeft, Send, Phone, Video, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  isOptimistic?: boolean; // For optimistic updates
}

interface Conversation {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  other_user: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    profile_pictures?: string[];
  };
}

export function DirectChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  const handleRealtimeMessage = useCallback((payload: any) => {
    const newMsg = payload.new as Message;
    
    setMessages(prev => {
      // Remove any optimistic message with same content if this is the real one
      const filteredPrev = prev.filter(msg => 
        !(msg.isOptimistic && msg.content === newMsg.content && msg.sender_id === newMsg.sender_id)
      );
      
      // Check if message already exists to prevent duplicates
      const exists = filteredPrev.some(msg => msg.id === newMsg.id);
      if (exists) return prev;
      
      return [...filteredPrev, newMsg];
    });
    
    // Mark message as read if it's not from current user
    if (newMsg.sender_id !== user?.id) {
      markMessageAsRead(newMsg.id);
    }
  }, [user?.id, markMessageAsRead]);

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();
      
      // Set up realtime subscription for new messages
      const messagesSubscription = supabase
        .channel(`direct-messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          handleRealtimeMessage
        )
        .subscribe();


      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [conversationId, user, handleRealtimeMessage, retryCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('direct_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get other user profile
      const otherUserId = convData.user_a === user.id ? convData.user_b : convData.user_a;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, profile_pictures')
        .eq('user_id', otherUserId)
        .single();

      if (profileError) throw profileError;

      setConversation({
        ...convData,
        other_user: profile
      });
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte ladda chatt",
        description: error.message
      });
      navigate('/chat');
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);

      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messagesData || []);

      // Mark unread messages as read
      const unreadMessages = messagesData?.filter(msg => 
        msg.sender_id !== user?.id && !msg.read_at
      ) || [];

      if (unreadMessages.length > 0) {
        const { error: readError } = await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));

        if (readError) {
          console.error('Error marking messages as read:', readError);
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Kunde inte ladda meddelanden",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      setSending(true);

      // Optimistic update - add message immediately to UI
      const optimisticMessage: Message = {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        content: messageContent,
        created_at: new Date().toISOString(),
        read_at: null,
        isOptimistic: true
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");

      // Send message to database
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...data, isOptimistic: false } : msg
        )
      );

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Restore message in input
      setNewMessage(messageContent);
      
      toast({
        variant: "destructive",
        title: "Kunde inte skicka meddelande",
        description: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Idag";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Igår";
    } else {
      return date.toLocaleDateString('sv-SE');
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar chatt...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border/50 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft size={20} />
            </Button>
            
            <ClickableAvatar
              src={conversation.other_user.avatar_url}
              fallback={(conversation.other_user.display_name || conversation.other_user.username || 'U').charAt(0).toUpperCase()}
              userName={conversation.other_user.display_name || conversation.other_user.username || 'Okänd användare'}
              profilePictures={conversation.other_user.profile_pictures || []}
              className="w-10 h-10 border-2 border-border/20"
            />
            
            <div>
              <h2 className="font-semibold">
                {conversation.other_user.display_name || conversation.other_user.username || 'Okänd'}
              </h2>
              {conversation.other_user.username && (
                <p className="text-xs text-muted-foreground">
                  @{conversation.other_user.username}
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Phone size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <Video size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <div className="bg-muted rounded-lg p-3 max-w-xs">
                      <div className="h-4 bg-muted-foreground/20 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date} className="space-y-4">
                {/* Date separator */}
                <div className="text-center">
                  <span className="bg-background/80 backdrop-blur text-muted-foreground text-xs px-3 py-1 rounded-full border">
                    {formatDate(dayMessages[0].created_at)}
                  </span>
                </div>

                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const showTime = index === dayMessages.length - 1 || 
                    dayMessages[index + 1]?.sender_id !== message.sender_id ||
                    new Date(dayMessages[index + 1]?.created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes

                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage 
                          ? 'gradient-primary text-white' 
                          : 'glass border border-border/50'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        {showTime && (
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <p className="text-sm">Inga meddelanden än</p>
                <p className="text-xs">Säg hej för att börja konversationen!</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="glass border-t border-border/50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv ett meddelande..."
              className="flex-1 glass border-border/50"
              disabled={sending}
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="gradient-primary text-white"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}