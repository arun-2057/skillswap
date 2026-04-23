'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/common/star-rating';
import { CreditBadge } from '@/components/common/credit-badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  Edit,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react';

interface ListingData {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string;
  creditCost: number;
  availability: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    avatar: string | null;
    timezone: string;
    averageRating: number;
    skillsOffered: string;
  };
}

export function ListingDetailPage() {
  const { route, navigate, goBack } = useRouterStore();
  const { user, isAuthenticated } = useAuthStore();
  const listingId = route.page === 'listing' ? route.id : '';
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isOwnListing = isAuthenticated && user?.id === listing?.user.id;

  useEffect(() => {
    if (!listingId) return;
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setListing(json.data);
          } else {
            toast.error('Listing not found');
            goBack();
          }
        } else {
          toast.error('Failed to load listing');
          goBack();
        }
      } catch {
        toast.error('Something went wrong');
        goBack();
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId, goBack]);

  async function handleBookSession() {
    if (!listing || !user) return;

    if (!bookingDate || !bookingTime) {
      toast.error('Please select a date and time');
      return;
    }

    const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();

    setBookingLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          scheduledAt,
          durationMinutes: parseInt(bookingDuration),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error?.message || 'Failed to book session');
        return;
      }

      toast.success('Session request sent!');
      setBookingOpen(false);
      navigate({ page: 'sessions' });
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBookingLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!listing) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !listing.isActive }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setListing({ ...listing, isActive: !listing.isActive });
        toast.success(listing.isActive ? 'Listing deactivated' : 'Listing activated');
      } else {
        toast.error(json.error?.message || 'Failed to update listing');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const tags: string[] = JSON.parse(listing.tags || '[]');
  const teacherSkills: string[] = JSON.parse(listing.user.skillsOffered || '[]');
  const initials = listing.user.name
    ? listing.user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={goBack}
      >
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Category */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{listing.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {listing.category}
                  {!listing.isActive && (
                    <Badge variant="secondary" className="ml-2">
                      Inactive
                    </Badge>
                  )}
                </p>
              </div>
              {isOwnListing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate({ page: 'create-listing', editId: listing.id })
                    }
                  >
                    <Edit className="size-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                    disabled={toggling}
                  >
                    {toggling && <Loader2 className="size-4 animate-spin" />}
                    {listing.isActive ? (
                      <>
                        <PowerOff className="size-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="size-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>Available: {listing.availability}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teacher card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="size-12">
                  <AvatarImage src={listing.user.avatar ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <button
                    onClick={() =>
                      navigate({ page: 'profile', id: listing.user.id })
                    }
                    className="font-semibold hover:underline"
                  >
                    {listing.user.name}
                  </button>
                  <div className="flex items-center gap-1">
                    <StarRating rating={listing.user.averageRating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {listing.user.averageRating > 0
                        ? listing.user.averageRating.toFixed(1)
                        : 'No reviews'}
                    </span>
                  </div>
                </div>
              </div>
              {listing.user.bio && (
                <p className="text-sm text-muted-foreground mb-3">
                  {listing.user.bio}
                </p>
              )}
              {teacherSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {teacherSkills.slice(0, 5).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking card */}
          {!isOwnListing && isAuthenticated && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Cost per session</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <CreditBadge amount={listing.creditCost} size="md" />
                    <span className="text-sm text-muted-foreground">credits</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setBookingOpen(true)}
                  disabled={!listing.isActive}
                >
                  {!listing.isActive ? 'Listing Inactive' : 'Book Session'}
                </Button>
              </CardContent>
            </Card>
          )}

          {!isAuthenticated && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to book this session
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate({ page: 'home' })}
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              Schedule a session with {listing.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                min={minDate}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={bookingDuration} onValueChange={setBookingDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <CreditBadge amount={listing.creditCost} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingOpen(false)}
              disabled={bookingLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookSession}
              disabled={bookingLoading || !bookingDate || !bookingTime}
            >
              {bookingLoading && <Loader2 className="size-4 animate-spin" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
