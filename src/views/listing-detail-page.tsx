'use client';

import { useEffect, useState } from 'react';
import { safeJsonArray } from '@/lib/safe-json';
import { useRouter, useParams } from 'next/navigation';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import {
  ArrowLeft,
  Edit,
  Power,
  PowerOff,
  Loader2,
  Calendar,
} from 'lucide-react';
import {
  getListingByIdAction,
  toggleListingActiveAction,
} from '@/app/actions/listings';
import { BookSessionDialog } from '@/components/book-session-dialog';

interface ListingData {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string;
  availability: string;
  isActive: boolean;
  createdAt: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  learningOutcomes: string; // stored as JSON string
  prerequisites: string; // stored as JSON string
  learningPath: string | null;
  isMentorship: boolean;
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

export function ListingDetailPage({ id }: { id?: string }) {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const listingId = id || (params?.id as string);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isOwnListing = isAuthenticated && user?.id === listing?.user.id;

  useEffect(() => {
    if (!listingId) return;
    async function fetchListing() {
      try {
        const data = await getListingByIdAction(listingId);
        if (data) {
          setListing(data as any);
        } else {
          toast.error('Listing not found');
          router.push('/browse');
        }
      } catch {
        toast.error('Failed to load listing');
        router.push('/browse');
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId, router]);

  async function handleToggleActive() {
    if (!listing) return;
    setToggling(true);
    try {
      const result = await toggleListingActiveAction(listing.id);
      if (result.ok) {
        setListing({ ...listing, isActive: !listing.isActive });
        toast.success(listing.isActive ? 'Listing deactivated' : 'Listing activated');
      } else {
        toast.error(result.error || 'Failed to update listing');
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

  const tags = safeJsonArray(listing.tags);
  const teacherSkills = safeJsonArray(listing.user.skillsOffered);
  const initials = listing.user.name
    ? listing.user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => router.back()}
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
                      router.push(`/create-listing?editId=${listing.id}`)
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
                      router.push(`/profile/${listing.user.id}`)
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

          {/* Proposal card */}
          {!isOwnListing && isAuthenticated && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Skill swap</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <SkillLevelIndicator level={listing.difficultyLevel} size="sm" />
                  <span className="text-sm text-muted-foreground">
                    {listing.estimatedDuration} min
                  </span>
                </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setProposalOpen(true)}
                  disabled={!listing.isActive}
                >
                  {!listing.isActive ? 'Listing Inactive' : 'Propose Swap'}
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
                    onClick={() => router.push('/')}
                  >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {listing && (
        <BookSessionDialog
          isOpen={proposalOpen}
          onClose={() => setProposalOpen(false)}
          targetTeacherId={listing.user.id}
          targetListingId={listing.id}
          targetListingTitle={listing.title}
        />
      )}
    </div>
  );
}
