'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

interface UseRealtimeNotificationsReturn {
  /** Current unread notification count */
  unreadCount: number;
  /** Force a manual refetch */
  refetch: () => Promise<void>;
  /** Mark a single notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { isAuthenticated, user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const count = json.data.filter(
            (n: Notification) => !n.isRead
          ).length;
          setUnreadCount(count);
        }
      }
    } catch {
      // Silently fail - polling will retry
    }
  }, [isAuthenticated, user]);

  // Supabase Realtime for notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // A new notification arrived - increment badge
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.isRead) {
            // Recalculate unread count from API for accuracy
            fetchUnreadCount();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Initial fetch
          fetchUnreadCount();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, fetchUnreadCount]);

  // Polling fallback every 30s
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const intervalId = setInterval(fetchUnreadCount, 30_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
        // Optimistic update
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Refetch on failure to reconcile
        fetchUnreadCount();
      }
    },
    [fetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      // Optimistic update
      setUnreadCount(0);
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    refetch: fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}
