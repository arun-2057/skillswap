'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Search, ArrowLeft, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChat, ConversationSummary } from '@/hooks/use-chat';
import { useAuthStore } from '@/store/auth-store';

interface ChatListProps {
  onSelectConversation: (id: string) => void;
  onBack?: () => void;
  selectedId?: string | null;
  conversations: ConversationSummary[];
  loading?: boolean;
}

export function ChatList({
  onSelectConversation,
  onBack,
  selectedId,
  conversations,
  loading,
}: ChatListProps) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((conv) => {
    if (!search) return true;
    const otherUser = conv.otherParticipants?.[0]?.user;
    return otherUser?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <h2 className="font-semibold text-lg">Messages</h2>
      </div>

      {/* Search */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!search && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Browse conversations to coordinate swaps and follow up quickly.
          </div>
        )}
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="size-12 mb-3 opacity-50" />
            <p className="text-sm">
              {search ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-xs mt-1">
              {search
                ? 'Try a different search term'
                : 'Start a conversation from a listing'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((conv) => {
              const otherUser = conv.otherParticipants?.[0]?.user;
              const lastMessage = conv.messages?.[0];
              const isSelected = conv.id === selectedId;

              if (!otherUser) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  <Avatar className="size-10 shrink-0 mt-0.5">
                    <AvatarImage src={otherUser.avatar ?? undefined} />
                    <AvatarFallback>
                      {otherUser.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {otherUser.name || 'Unknown User'}
                      </span>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>

                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {lastMessage.content}
                      </p>
                    )}

                    {conv.listing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Re: {conv.listing.title}
                      </p>
                    )}
                    {!lastMessage && conv.listing && (
                      <p className="text-xs text-primary mt-1">Start the conversation by introducing yourself.</p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px]"
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}