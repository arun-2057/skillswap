'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { createReviewSchema } from '@/lib/validators';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { CreditBadge } from '@/components/common/credit-badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';

interface SessionData {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  creditCost: number;
  createdAt: string;
  videoLink: string | null;
  listing: {
    id: string;
    title: string;
    category: string;
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
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    reviewerId: string;
    createdAt: string;
  }[];
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  PENDING: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    label: 'Pending Approval',
  },
  CONFIRMED: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
    label: 'Confirmed',
  },
  COMPLETED: {
    bg: 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300',
    label: 'Completed',
  },
  CANCELLED: {
    bg: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
    label: 'Cancelled',
  },
};

export function SessionDetailPage() {
  const { route, navigate, goBack } = useRouterStore();
  const { user } = useAuthStore();
  const sessionId = route.page === 'session' ? route.id : '';
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isTeacher = user?.id === session?.teacher.id;
  const isLearner = user?.id === session?.learner.id;
  const hasReviewed =
    session?.reviews.some((r) => r.reviewerId === user?.id) ?? false;

  useEffect(() => {
    if (!sessionId) return;
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSession(json.data);
          } else {
            toast.error('Session not found');
            goBack();
          }
        } else {
          toast.error('Failed to load session');
          goBack();
        }
      } catch {
        toast.error('Something went wrong');
        goBack();
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionId, goBack]);

  async function handleStatusUpdate(newStatus: string) {
    if (!session) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (res.ok) {
        setSession({ ...session, status: newStatus });
        toast.success(
          newStatus === 'CONFIRMED'
            ? 'Session confirmed!'
            : newStatus === 'COMPLETED'
              ? 'Session marked as complete!'
              : 'Session cancelled.'
        );
      } else {
        toast.error(json.error?.message || 'Failed to update session');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!session) return;

    const result = createReviewSchema.safeParse({
      rating: reviewRating,
      comment: reviewComment || undefined,
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const json = await res.json();
      if (res.ok) {
        setSession({
          ...session,
          reviews: [
            ...session.reviews,
            {
              id: json.data?.id || 'new',
              rating: reviewRating,
              comment: reviewComment || null,
              reviewerId: user?.id || '',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        toast.success('Review submitted!');
      } else {
        toast.error(json.error?.message || 'Failed to submit review');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-16 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const style = STATUS_STYLES[session.status] || STATUS_STYLES.PENDING;
  const scheduledDate = new Date(session.scheduledAt);

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={goBack}>
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>

      {/* Status banner */}
      <div
        className={`rounded-lg border p-4 mb-6 flex items-center gap-3 ${style.bg}`}
      >
        {session.status === 'CONFIRMED' || session.status === 'COMPLETED' ? (
          <CheckCircle className="size-5 shrink-0" />
        ) : (
          <XCircle className="size-5 shrink-0" />
        )}
        <div>
          <p className="font-semibold">{style.label}</p>
          {session.status === 'PENDING' && isTeacher && (
            <p className="text-sm opacity-80">
              You can accept or decline this session request
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Calendar className="size-3.5" />
                {scheduledDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Clock className="size-3.5" />
                {scheduledDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Clock className="size-3.5" />
                {session.durationMinutes} min
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Credits</p>
              <div className="flex items-center justify-center">
                <CreditBadge amount={session.creditCost} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher & Learner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={session.teacher.avatar ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(session.teacher.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() =>
                  navigate({ page: 'profile', id: session.teacher.id })
                }
                className="font-medium hover:underline"
              >
                {session.teacher.name}
                {isTeacher && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    You
                  </Badge>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Learner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={session.learner.avatar ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(session.learner.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() =>
                  navigate({ page: 'profile', id: session.learner.id })
                }
                className="font-medium hover:underline"
              >
                {session.learner.name}
                {isLearner && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    You
                  </Badge>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listing summary */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() =>
              navigate({ page: 'listing', id: session.listing.id })
            }
            className="font-medium hover:underline"
          >
            {session.listing.title}
          </button>
          <Badge variant="outline" className="ml-2 text-xs">
            {session.listing.category}
          </Badge>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {session.status === 'PENDING' && isTeacher && (
          <>
            <Button
              onClick={() => handleStatusUpdate('CONFIRMED')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              <CheckCircle className="size-4 mr-1" />
              Accept
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              <XCircle className="size-4 mr-1" />
              Decline
            </Button>
          </>
        )}
        {session.status === 'CONFIRMED' && isTeacher && (
          <>
            <Button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              <CheckCircle className="size-4 mr-1" />
              Mark Complete
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              <XCircle className="size-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
        {session.status === 'CONFIRMED' && isLearner && (
          <Button
            variant="outline"
            onClick={() => handleStatusUpdate('CANCELLED')}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="size-4 animate-spin" />}
            <XCircle className="size-4 mr-1" />
            Cancel Session
          </Button>
        )}
      </div>

      {/* Reviews section */}
      {session.reviews.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Reviews</h2>
          <div className="space-y-3">
            {session.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Write review */}
      {session.status === 'COMPLETED' && !hasReviewed && (isTeacher || isLearner) && (
        <>
          <Separator className="my-6" />
          <Card>
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Your Rating</p>
                <StarRating
                  rating={reviewRating}
                  size="lg"
                  interactive
                  onChange={setReviewRating}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">
                  Comment (optional)
                </p>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || submittingReview}
              >
                {submittingReview && <Loader2 className="size-4 animate-spin" />}
                <Send className="size-4 mr-1" />
                Submit Review
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
