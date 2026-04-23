'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ArrowUpCircle, ArrowDownCircle, RotateCcw, Loader2, Wallet } from 'lucide-react';

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
  sessionId: string | null;
  fromUser: {
    id: string;
    name: string;
  };
  toUser: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    listing: {
      title: string;
    };
  };
}

const TYPE_CONFIG: Record<string, {
  color: string;
  icon: typeof ArrowUpCircle;
  label: string;
  amountPrefix: string;
}> = {
  EARN: {
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: ArrowUpCircle,
    label: 'Earned',
    amountPrefix: '+',
  },
  SPEND: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: ArrowDownCircle,
    label: 'Spent',
    amountPrefix: '-',
  },
  REFUND: {
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: RotateCcw,
    label: 'Refund',
    amountPrefix: '+',
  },
};

export function TransactionsPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTransactions = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('limit', '20');
        if (typeFilter !== 'ALL') params.set('type', typeFilter);
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (isLoadMore) {
              setTransactions((prev) => [...prev, ...json.data]);
            } else {
              setTransactions(json.data);
            }
            setHasMore(json.hasMore);
            setNextCursor(json.nextCursor);
          }
        }
      } catch {
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [typeFilter]
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  function getCounterparty(tx: TransactionData): string {
    if (tx.type === 'EARN') return tx.fromUser.name;
    if (tx.type === 'SPEND') return tx.toUser.name;
    return tx.type === 'REFUND'
      ? tx.toUser.id === user?.id
        ? tx.fromUser.name
        : tx.toUser.name
      : '';
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
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
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full rounded-lg mb-4" />
          <Skeleton className="h-10 w-44 mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Transactions</h1>
      <p className="text-muted-foreground mb-6">
        Track your credit history
      </p>

      {/* Balance summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold flex items-center gap-2 mt-1">
                <Wallet className="size-7 text-muted-foreground" />
                {user?.creditBalance ?? 0} <span className="text-base font-normal text-muted-foreground">credits</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="EARN">Earn</SelectItem>
            <SelectItem value="SPEND">Spend</SelectItem>
            <SelectItem value="REFUND">Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description={
            typeFilter !== 'ALL'
              ? 'No transactions match this filter.'
              : 'Transactions will appear here once you start trading skills.'
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {transactions.map((tx) => {
              const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.SPEND;
              const IconComponent = config.icon;
              const amount =
                tx.type === 'SPEND'
                  ? -tx.amount
                  : tx.amount;

              return (
                <div
                  key={tx.id}
                  className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${config.color}`}>
                      <IconComponent className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {config.label}
                        </p>
                        <CreditBadge amount={amount} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getCounterparty(tx)} &middot;{' '}
                        {formatDate(tx.createdAt)} at {formatTime(tx.createdAt)}
                      </p>
                      {tx.session?.listing && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {tx.session.listing.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchTransactions(nextCursor)}
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
