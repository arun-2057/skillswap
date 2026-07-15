"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, AlertCircle, RefreshCw, MessageSquareMore } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/store/chat-store";

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
}

export function ChatView({ conversationId, currentUserId }: ChatViewProps) {
  const { messages, sendMessage, retryMessage } = useChatStore();
  const conversationMessages = messages[conversationId] || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      useChatStore.setState((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (data || []).map((m: any) => ({
            ...m,
            isSending: false,
            failed: false,
          })),
        },
      }));
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`room-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          useChatStore.setState((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || [])].filter(
                (m) => !m.id.startsWith("temp-")
              ),
            },
          }));
          useChatStore.setState((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), payload.new as any],
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages, conversationMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  const onSendMessage = async (data: { content: string }) => {
    if (!data.content.trim()) return;
    reset();
    await sendMessage(conversationId, data.content, currentUserId);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-xl bg-card">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {conversationMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              <MessageSquareMore className="mb-2 size-6 text-primary" />
              <p className="font-medium text-foreground">Start the conversation</p>
              <p className="mt-1">Share availability, expectations, or a quick hello to get things moving.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {conversationMessages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isOptimistic = msg.id.startsWith("temp-");
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      } ${msg.failed ? "border-2 border-destructive" : ""}`}
                    >
                      {msg.content}
                    </div>
                    {msg.failed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 self-end"
                        onClick={() => retryMessage(conversationId, msg.id, msg.content, currentUserId)}
                        aria-label="Retry sending message"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                    {isOptimistic && msg.isSending && (
                      <div className="text-xs text-muted-foreground self-end">
                        Sending...
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit(onSendMessage)} className="p-3 border-t flex gap-2">
        <Input
          {...register("content")}
          placeholder="Type your coordination message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}