'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditBadge } from '@/components/common/credit-badge';
import { EmptyState } from '@/components/common/empty-state';
import { Calendar, Clock, Loader2 } from 'lucide-react';

interface SessionCard {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  creditCost: number;
  listing: {
    id: string;
    title: string;
  };
  learner: {
    id: string;
    name: string;
    avatar: string | null;
  };
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  CONFIRMED: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

export function SessionsPage() {
  const { navigate } = useRouterStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('learner');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetchSessions = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('role', activeTab);
        params.set('limit', '20');
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/sessions?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (isLoadMore) {
              setSessions((prev) => [...prev, ...json.data]);
            } else {
              setSessions(json.data);
            }
            setHasMore(json.hasMore);
            setNextCursor(json.nextCursor);
          }
        }
      } catch {
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, statusFilter]
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function getOtherParty(session: SessionCard) {
    if (activeTab === 'learner') return session.teacher;
    return session.learner;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Sessions</h1>
      <p className="text-muted-foreground mb-6">
        Manage your learning and teaching sessions
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
          <TabsList>
            <TabsTrigger value="learner">As Learner</TabsTrigger>
            <TabsTrigger value="teacher">As Teacher</TabsTrigger>
          </TabsList>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab}>
          {sessions.length === 0 ? (
            <EmptyState
              title="No sessions found"
              description={
                statusFilter !== 'ALL'
                  ? 'No sessions match this filter. Try a different status.'
                  : activeTab === 'learner'
                    ? 'You haven\'t booked any sessions yet. Browse skills to get started!'
                    : 'No one has booked a session with you yet.'
              }
              action={
                activeTab === 'learner' && statusFilter === 'ALL'
                  ? { label: 'Browse Skills', onClick: () => navigate({ page: 'browse' }) }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const other = getOtherParty(session);
                  const otherInitials = other.name
                    ? other.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U';

                  return (
                    <button
                      key={session.id}
                      onClick={() =>
                        navigate({ page: 'session', id: session.id })
                      }
                      className="w-full text-left rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={other.avatar ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {otherInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium truncate">
                              {other.name}
                            </p>
                            <Badge
                              variant={STATUS_VARIANTS[session.status] || 'outline'}
                              className={STATUS_COLORS[session.status]}
                            >
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {session.listing.title}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(session.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatTime(session.scheduledAt)}
                            </div>
                            <CreditBadge
                              amount={session.creditCost}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchSessions(nextCursor)}
                    disabled={loadingMore}
                  >
                    {loadingMore && <Loader2 className="size-4 animate-spin" />}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
