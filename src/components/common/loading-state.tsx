'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant: 'card' | 'table' | 'list' | 'page';
  count?: number;
}

export function LoadingState({ variant, count = 3 }: LoadingStateProps) {
  switch (variant) {
    case 'card':
      return (
        <div className={cn('grid gap-6', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3')}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="size-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      );

    case 'page':
      return (
        <div className="space-y-8 animate-in fade-in">
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
  }
}
