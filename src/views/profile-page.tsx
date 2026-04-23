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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { CreditBadge } from '@/components/common/credit-badge';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  Coins,
  Star,
  MapPin,
  Calendar,
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  timezone: string;
  creditBalance: number;
  averageRating: number;
  skillsOffered: string;
  skillsWanted: string;
  isOnboarded: boolean;
  createdAt: string;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ListingCardData {
  id: string;
  title: string;
  category: string;
  creditCost: number;
  tags: string;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function ProfilePage() {
  const { route, navigate, goBack } = useRouterStore();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const profileId = route.page === 'profile' ? route.id : undefined;
  const isEditProfile = route.page === 'edit-profile';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(isEditProfile);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTimezone, setEditTimezone] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !profileId || profileId === user?.id;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const id = profileId || 'me';
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setProfile(json.data);
            setEditName(json.data.name || '');
            setEditBio(json.data.bio || '');
            setEditTimezone(json.data.timezone);
          }
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    async function fetchReviews() {
      try {
        const id = profileId || 'me';
        const res = await fetch(`/api/users/${id}/reviews?limit=10`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setReviews(json.data);
          }
        }
      } catch {
        // Silently fail
      }
    }

    async function fetchListings() {
      try {
        const id = profileId || 'me';
        const res = await fetch(`/api/users/${id}/listings?limit=6`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setListings(json.data);
          }
        }
      } catch {
        // Silently fail
      }
    }

    fetchProfile();
    fetchReviews();
    fetchListings();
  }, [profileId]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          bio: editBio || undefined,
          timezone: editTimezone,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setProfile(json.data);
        if (isOwnProfile && user) {
          setUser({ ...user, name: json.data.name, bio: json.data.bio, timezone: json.data.timezone });
        }
        setIsEditing(false);
        toast.success('Profile updated!');
      } else {
        toast.error(json.error?.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <LoadingState variant="page" count={1} />
      </div>
    );
  }

  if (!profile) return null;

  const skillsOffered: string[] = JSON.parse(profile.skillsOffered || '[]');
  const skillsWanted: string[] = JSON.parse(profile.skillsWanted || '[]');
  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Back button */}
      {!isOwnProfile && (
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={goBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      )}

      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="size-20 sm:size-24">
              <AvatarImage src={profile.avatar ?? undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {isEditing && isOwnProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={editTimezone} onValueChange={setEditTimezone}>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      <Save className="size-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile.name || '');
                        setEditBio(profile.bio || '');
                        setEditTimezone(profile.timezone);
                      }}
                    >
                      <X className="size-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold">{profile.name}</h1>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="size-4 mr-1" />
                        Edit Profile
                      </Button>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {profile.timezone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Joined {memberSince}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5" />
                      {profile.averageRating > 0
                        ? `${profile.averageRating.toFixed(1)} avg rating`
                        : 'No reviews yet'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {!isEditing && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold mt-1">{profile.creditBalance}</p>
                  <p className="text-xs text-muted-foreground">Credits</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold mt-1">
                    {profile.averageRating > 0
                      ? profile.averageRating.toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Edit className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-bold mt-1">{skillsOffered.length}</p>
                  <p className="text-xs text-muted-foreground">Skills</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {skillsOffered.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Skills Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {skillsOffered.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {skillsWanted.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Skills Wanted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {skillsWanted.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Listings */}
      {!isEditing && listings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {isOwnProfile ? 'My Listings' : `${profile.name}'s Listings`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const tags: string[] = JSON.parse(listing.tags || '[]');
              return (
                <Card
                  key={listing.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    navigate({ page: 'listing', id: listing.id })
                  }
                >
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-1 line-clamp-1">
                      {listing.title}
                    </h3>
                    <Badge variant="outline" className="text-xs mb-2">
                      {listing.category}
                    </Badge>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tags.slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CreditBadge amount={listing.creditCost} size="sm" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews */}
      {!isEditing && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description={
                isOwnProfile
                  ? 'Complete sessions to receive reviews from learners.'
                  : `${profile.name} hasn't received any reviews yet.`
              }
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const reviewerInitials = review.reviewer.name
                  ? review.reviewer.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'U';

                return (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            src={review.reviewer.avatar ?? undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {reviewerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <button
                                onClick={() =>
                                  navigate({
                                    page: 'profile',
                                    id: review.reviewer.id,
                                  })
                                }
                                className="text-sm font-medium hover:underline"
                              >
                                {review.reviewer.name}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(review.createdAt)}
                              </p>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
