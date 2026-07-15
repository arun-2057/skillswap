import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file';
  media_url?: string | null;
  file_type?: string;
  file_size?: number;
  created_at: string;
  isSending?: boolean;
  failed?: boolean;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  presence: Record<string, { online: boolean; lastSeen: string }>;
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'created_at'> & { id?: string }) => void;
  sendMessage: (conversationId: string, content: string, senderId: string) => Promise<void>;
  markFailed: (conversationId: string, tempId: string) => void;
  retryMessage: (conversationId: string, tempId: string, content: string, senderId: string) => Promise<void>;
  clearMessages: (conversationId: string) => void;
  updatePresence: (conversationId: string, online: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  presence: {},

  addMessage: (conversationId, message) => {
    const tempId = message.id || `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newMessage: ChatMessage = {
      ...message,
      id: tempId,
      created_at: new Date().toISOString(),
      isSending: true,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), newMessage],
      },
    }));
  },

  sendMessage: async (conversationId, content, senderId) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = new Date().toISOString();

    // Optimistic add
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          { id: tempId, conversation_id: conversationId, sender_id: senderId, content, message_type: 'text', created_at: timestamp, isSending: true },
        ],
      },
    }));

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: "text",
      });

      if (error) throw error;

      // Mark as sent (remove isSending flag)
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(m =>
            m.id === tempId ? { ...m, isSending: false } : m
          ) || [],
        },
      }));
    } catch (err) {
      console.error("Failed to send message:", err);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(m =>
            m.id === tempId ? { ...m, isSending: false, failed: true } : m
          ) || [],
        },
      }));
    }
  },

  markFailed: (conversationId, tempId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: state.messages[conversationId]?.map(m =>
          m.id === tempId ? { ...m, isSending: false, failed: true } : m
        ) || [],
      },
    }));
  },

  retryMessage: async (conversationId, tempId, content, senderId) => {
    const message = get().messages[conversationId]?.find(m => m.id === tempId);
    if (!message || message.failed) {
      // Clear failed flag optimistically
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: state.messages[conversationId]?.map(m =>
            m.id === tempId ? { ...m, isSending: true, failed: false } : m
          ) || [],
        },
      }));

      try {
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: message?.content || content,
          message_type: "text",
        });

        if (error) throw error;

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(m =>
              m.id === tempId ? { ...m, isSending: false, failed: false } : m
            ) || [],
          },
        }));
      } catch (err) {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId]?.map(m =>
              m.id === tempId ? { ...m, isSending: false, failed: true } : m
            ) || [],
          },
        }));
      }
    }
  },

  clearMessages: (conversationId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [],
      },
    }));
  },

  updatePresence: (conversationId, online) => {
    set((state) => ({
      presence: {
        ...state.presence,
        [conversationId]: {
          online,
          lastSeen: online ? '' : new Date().toISOString(),
        },
      },
    }));
  },
}));