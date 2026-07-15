'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useChat } from '@/hooks/use-chat';
import { ChatList } from '@/components/chat/chat-list';
import { ChatView } from '@/components/chat/chat-view';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { PushNotificationService } from '@/lib/push-notifications';

export function MessagesPage({ initialConversationId }: { initialConversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const {
    conversations,
    loading,
    activeConversationId,
    setActiveConversation,
    fetchConversations,
  } = useChat();

  const [showMobileList, setShowMobileList] = useState(true);

  useEffect(() => {
    PushNotificationService.requestPermission();
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const conversationId = initialConversationId || searchParams?.get('conversationId');
    if (conversationId) {
      setActiveConversation(conversationId);
      setShowMobileList(false);
    }
  }, [initialConversationId, searchParams, setActiveConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
      setShowMobileList(false);
    },
    [setActiveConversation]
  );

  const handleBack = useCallback(() => {
    setActiveConversation(null);
    setShowMobileList(true);
    router.push('/messages');
  }, [setActiveConversation, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-muted-foreground">
        <MessageSquare className="size-16 mb-4 opacity-30" />
        <h2 className="text-lg font-medium mb-2">Messages</h2>
        <p className="text-sm mb-4">Sign in to view your messages</p>
        <Button onClick={() => router.push('/')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)]">
      <div
        className={`md:flex md:w-80 md:border-r w-full ${
          showMobileList ? 'flex' : 'hidden'
        }`}
      >
        <ChatList
          conversations={conversations}
          loading={loading}
          onSelectConversation={handleSelectConversation}
          selectedId={activeConversationId ?? undefined}
        />
      </div>

      <div
        className={`md:flex md:flex-1 w-full ${
          !showMobileList ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversationId && user ? (
          <ChatView
            conversationId={activeConversationId}
            currentUserId={user.id}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center flex-1 text-muted-foreground">
            <MessageSquare className="size-16 mb-4 opacity-30" />
            <h2 className="text-lg font-medium">Your Messages</h2>
            <p className="text-sm mt-1">
              Select a conversation from the left to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
