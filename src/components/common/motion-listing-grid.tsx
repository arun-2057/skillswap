'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import { safeJsonArray } from '@/lib/safe-json';
import { ArrowRight } from 'lucide-react';
import { MotionGrid, MotionCard } from '@/components/common/motion-grid';

interface ListingCard {
  id: string;
  title: string;
  category: string;
  tags: string;
  difficultyLevel: string;
  estimatedDuration: number;
  description: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number;
  };
}

interface MotionListingGridProps {
  listings: ListingCard[];
  /** A key that changes when filters are applied, triggering exit/enter animations */
  filterKey?: string;
}

export function MotionListingGrid({
  listings,
  filterKey,
}: MotionListingGridProps) {
  const router = useRouter();

  function renderListingCard(listing: ListingCard) {
    const tags = safeJsonArray(listing.tags);
    const initials = listing.user.name
      ? listing.user.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return (
      <MotionCard
        key={listing.id}
        id={listing.id}
        className="rounded-xl border bg-card p-6 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => {
          // Gate modal overlay for client transitions only.
          try {
            window.sessionStorage.setItem(
              `modal:listing:${listing.id}`,
              '1'
            );
          } catch {
            // ignore
          }
          router.push(`/browse/(.)listing/${listing.id}`);
        }}
        ariaLabel={`View listing: ${listing.title} by ${listing.user.name}`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={listing.user.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{listing.user.name}</p>
            <div className="flex items-center gap-1">
              <StarRating rating={listing.user.averageRating} size="sm" />
              <span className="text-xs text-muted-foreground">
                {listing.user.averageRating > 0
                  ? listing.user.averageRating.toFixed(1)
                  : 'New'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-1.5 line-clamp-2">
            {listing.title}
          </h3>
          <Badge variant="outline" className="text-xs">
            {listing.category}
          </Badge>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 gap-3">
          <div className="flex flex-col">
            <SkillLevelIndicator
              level={(listing.difficultyLevel as any) ?? 'intermediate'}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {listing.estimatedDuration} min
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`View details for ${listing.title}`}
          >
            View Details
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </MotionCard>
    );
  }

  return (
    <MotionGrid
      animateKey={filterKey}
      className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      {listings.map(renderListingCard)}
    </MotionGrid>
  );
}