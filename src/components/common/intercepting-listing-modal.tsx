'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import { safeJsonArray } from '@/lib/safe-json';

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
  learningOutcomes: string;
  prerequisites: string;
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

interface InterceptingListingModalProps {
  listingId: string;
}

export function InterceptingListingModal({
  listingId,
}: InterceptingListingModalProps) {
  const router = useRouter();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

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
            handleClose();
          }
        } else {
          toast.error('Failed to load listing');
          handleClose();
        }
      } catch {
        toast.error('Something went wrong');
        handleClose();
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId]);

  function handleClose() {
    setOpen(false);
    // Small delay to allow exit animation before navigating back
    setTimeout(() => {
      router.back();
    }, 200);
  }

  function handleOpenFullPage() {
    setOpen(false);
    setTimeout(() => {
      router.push(`/listing/${listingId}`);
    }, 200);
  }

  const tags = listing ? safeJsonArray(listing.tags) : [];
  const teacherSkills = listing ? safeJsonArray(listing.user.skillsOffered) : [];
  const initials = listing?.user.name
    ? listing.user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-label={listing ? `Listing: ${listing.title}` : 'Loading listing'}
        >
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            className="relative z-10 w-full max-w-3xl mx-4 my-4 sm:my-8 rounded-2xl border bg-background shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenFullPage}
                aria-label="Open full page"
              >
                Open full page
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Close modal"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[80vh] p-6">
              {loading ? (
                <div className="space-y-6">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ) : !listing ? (
                <div className="text-center py-12 text-muted-foreground">
                  Listing not found
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold">{listing.title}</h2>
                      <p className="text-muted-foreground mt-1">
                        {listing.category}
                        {!listing.isActive && (
                          <Badge variant="secondary" className="ml-2">
                            Inactive
                          </Badge>
                        )}
                      </p>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {listing.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                            <AvatarImage
                              src={listing.user.avatar ?? undefined}
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {listing.user.name}
                            </p>
                            <div className="flex items-center gap-1">
                              <StarRating
                                rating={listing.user.averageRating}
                                size="sm"
                              />
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
                                <Badge
                                  key={s}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Duration card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <p className="text-sm text-muted-foreground">
                            Duration
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <SkillLevelIndicator
                              level={listing.difficultyLevel}
                              size="sm"
                            />
                            <span className="text-sm text-muted-foreground">
                              {listing.estimatedDuration} min
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleOpenFullPage}
                      aria-label="View full listing page"
                    >
                      View Full Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}