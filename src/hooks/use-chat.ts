'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

export interface ChatUser {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE';
  mediaUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: ChatUser;
}

export interface ConversationSummary {
  id: string;
  listingId?: string | null;
  updatedAt: string;
  unreadCount: number;
  otherParticipants: Array<{
    userId: string;
    user: ChatUser;
  }>;
  messages: ChatMessage[];
  listing?: {
    id: string;
    title: string;
    category: string;
  } | null;
}

interface UseChatReturn {
  isConnected: boolean;
  onlineUsers: string[];
  conversations: ConversationSummary[];
  messages: ChatMessage[];
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  createConversation: (participantId: string, initialMessage: string, listingId?: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  typingUsers: Map<string, string[]>;
}

export function useChat(): UseChatReturn {
  const { isAuthenticated, user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, string[]>>(new Map());
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setConversations(json.data);
        }
      }
    } catch (err) {
      console.error('[Chat] Error fetching conversations:', err);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessages(json.data);
        }
      }
    } catch (err) {
      console.error('[Chat] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supabase Realtime for messaging and typing
  useEffect(() => {
    if (!isAuthenticated) return;

    const messagingChannel = supabase
      .channel('global-messaging')
      .on('broadcast', { event: 'typing-start' }, ({ payload }) => {
        const { conversationId, userId } = payload as { conversationId: string; userId: string };
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const users = next.get(conversationId) || [];
          if (!users.includes(userId)) {
            next.set(conversationId, [...users, userId]);
          }
          return next;
        });

        const timeoutKey = `${conversationId}:${userId}`;
        if (typingTimeouts.current.has(timeoutKey)) {
          clearTimeout(typingTimeouts.current.get(timeoutKey)!);
        }
        typingTimeouts.current.set(
          timeoutKey,
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              const users = next.get(conversationId) || [];
              next.set(conversationId, users.filter((id) => id !== userId));
              return next;
            });
          }, 3000)
        );
      })
      .on('broadcast', { event: 'typing-stop' }, ({ payload }) => {
        const { conversationId, userId } = payload as { conversationId: string; userId: string };
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const users = next.get(conversationId) || [];
          next.set(conversationId, users.filter((id) => id !== userId));
          return next;
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    channelRef.current = messagingChannel;

    return () => {
      supabase.removeChannel(messagingChannel);
      channelRef.current = null;
    };
  }, [isAuthenticated]);

  // Listen for Postgres changes on messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const messageChannel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [activeConversationId, fetchConversations]);

  // Listen for Postgres changes on conversations
  useEffect(() => {
    if (!isAuthenticated) return;

    const conversationsChannel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [isAuthenticated, fetchConversations]);

  // Track presence for online users
  useEffect(() => {
    if (!isAuthenticated) return;

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user?.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{ userId: string }>();
        const userIds = Object.keys(state).map((key) => {
          const presence = state[key];
          return presence?.[0]?.userId || key;
        });
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ userId: user?.id || '' });
          presenceRef.current = presenceChannel;
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
      presenceRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setMessages((prev) => [...prev, json.data]);
          }
        }
      } catch (err) {
        console.error('[Chat] Error sending message:', err);
      }
    },
    []
  );

  const createConversation = useCallback(
    async (
      participantId: string,
      initialMessage: string,
      listingId?: string
    ): Promise<string | null> => {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId,
            initialMessage,
            listingId,
          }),
        });
        const json = await res.json();
        if (json.success) {
          await fetchConversations();
          return json.data.id;
        }
        return null;
      } catch (err) {
        console.error('[Chat] Error creating conversation:', err);
        return null;
      }
    },
    [fetchConversations]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      // Optimistic update
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );

      try {
        await fetch(`/api/conversations/${conversationId}/read`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('[Chat] Error marking as read:', err);
      }
    },
    []
  );

  const startTyping = useCallback((conversationId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing-start',
      payload: { conversationId, userId: user?.id },
    });
  }, [user?.id]);

  const stopTyping = useCallback((conversationId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing-stop',
      payload: { conversationId, userId: user?.id },
    });
  }, [user?.id]);

  const setActiveConversation = useCallback(
    (id: string | null) => {
      setActiveConversationId(id);
      if (id) {
        fetchMessages(id);
        markAsRead(id);
      } else {
        setMessages([]);
      }
    },
    [fetchMessages, markAsRead]
  );

  return {
    isConnected,
    onlineUsers,
    conversations,
    messages,
    loading,
    activeConversationId,
    setActiveConversation,
    sendMessage,
    fetchConversations,
    fetchMessages,
    createConversation,
    markAsRead,
    startTyping,
    stopTyping,
    typingUsers,
  };
}
