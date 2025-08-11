import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface NotificationCounts {
  groups: number;  // vänförfrågningar + gruppinbjudningar
  chat: number;    // olästa meddelanden
  parties: number; // festinbjudningar
}

export function useNotifications() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    groups: 0,
    chat: 0,
    parties: 0
  });

  useEffect(() => {
    if (!user) return;

    fetchNotificationCounts();
    
    // Set up real-time listeners
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends'
      }, () => fetchNotificationCounts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'direct_messages'
      }, () => fetchNotificationCounts())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'party_attendees'
      }, () => fetchNotificationCounts())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotificationCounts = async () => {
    if (!user) return;

    try {
      // Count pending friend requests
      const { count: friendRequestsCount } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Count unread messages
      const { data: conversations } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      let totalUnreadMessages = 0;
      if (conversations) {
        for (const conv of conversations) {
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);
          
          totalUnreadMessages += count || 0;
        }
      }

      // Count party invitations (pending attendee requests)
      const { count: partyInvitesCount } = await supabase
        .from('party_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'invited');

      setCounts({
        groups: friendRequestsCount || 0,
        chat: totalUnreadMessages,
        parties: partyInvitesCount || 0
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  const clearNotifications = (type: keyof NotificationCounts) => {
    setCounts(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  return {
    counts,
    clearNotifications,
    refreshCounts: fetchNotificationCounts
  };
}