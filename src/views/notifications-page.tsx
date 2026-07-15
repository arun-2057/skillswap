'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
  Bell,
  Check,
  XCircle,
  Star,
  AlertTriangle,
  CheckCheck,
  Loader2,
} from 'lucide-react';

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  SESSION_REQUEST: Bell,
  SESSION_CONFIRMED: Check,
  SESSION_CANCELLED: XCircle,
  REVIEW_RECEIVED: Star,
  LOW_BALANCE: AlertTriangle,
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationAction(type: string): { page: string; id?: string } | null {
  switch (type) {
    case 'SESSION_REQUEST':
    case 'SESSION_CONFIRMED':
    case 'SESSION_CANCELLED':
      return { page: 'sessions' };
    case 'REVIEW_RECEIVED':
      return { page: 'profile' };
    default:
      return null;
  }
}

function getTargetId(metadata: Record<string, any> | string | undefined): string | undefined {
  if (!metadata) return undefined;
  
  // Handle string (legacy JSON format)
  let parsed: Record<string, any>;
  if (typeof metadata === 'string') {
    try {
      parsed = JSON.parse(metadata);
    } catch {
      return undefined;
    }
  } else {
    parsed = metadata;
  }
  
  return parsed.sessionId || parsed.userId || parsed.id || parsed.relatedId;
}

export function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentOffset(0);
    }

    try {
      const params = new URLSearchParams();
      const limit = 20;
      
      // Use ref or state to get the correct offset
      const effectiveOffset = loadMore ? currentOffset : 0;
      params.set('limit', String(limit));
      params.set('offset', String(effectiveOffset));

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const incoming = json.data;
          if (loadMore) {
            setNotifications((prev) => [...prev, ...incoming]);
            setCurrentOffset((prev) => prev + incoming.length);
          } else {
            setNotifications(incoming);
          }
          // Check if there are more notifications based on pagination
          const total = json.pagination?.total ?? 0;
          const receivedCount = loadMore ? effectiveOffset + incoming.length : incoming.length;
          setHasMore(total > receivedCount);
        }
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentOffset]);

  useEffect(() => {
    // Avoid triggering setState directly in the effect body.
    const initial = () => fetchNotifications();
    initial();
  }, [fetchNotifications]);


  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        toast.success('All notifications marked as read');
      }
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleMarkAsRead(notification: NotificationData) {
    if (notification.isRead) return;

    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'POST',
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    } catch {
      // Silently fail
    }
  }

  async function handleClick(notification: NotificationData) {
    await handleMarkAsRead(notification);

    const action = getNotificationAction(notification.type);
    if (!action) return;

    const targetId = getTargetId(notification.metadata);

    switch (action.page) {
      case 'sessions':
        if (targetId) {
          router.push(`/session/${targetId}`);
        } else {
          router.push('/sessions');
        }
        break;
      case 'profile':
        if (targetId) {
          router.push(`/profile/${targetId}`);
        } else {
          router.push('/profile/me');
        }
        break;
      case 'browse':
        router.push('/browse');
        break;
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-3 w-1/4 ml-11" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications will appear here when something happens."
        />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => {
              const IconComponent =
                NOTIFICATION_ICONS[notification.type] || Bell;

              return (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`w-full text-left rounded-lg border p-4 hover:bg-accent/50 transition-colors ${
                    !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 shrink-0 ${
                        notification.isRead
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <IconComponent className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p
                          className={`text-sm ${
                            notification.isRead
                              ? 'text-muted-foreground'
                              : 'font-medium'
                          }`}
                        >
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <span className="shrink-0 mt-1.5 flex size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
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
                onClick={() => fetchNotifications(true)}
                disabled={loadingMore}
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
