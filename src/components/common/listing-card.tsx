'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import { ArrowRight } from 'lucide-react';
import { safeJsonArray } from '@/lib/safe-json';
import { getInitials } from '@/lib/initials';

export interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    category: string;
    tags: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    user: {
      avatar: string | null;
      name: string | null;
      averageRating: number;
    };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();
  const tags = safeJsonArray(listing.tags);

  function initials(listingUser: { name?: string | null }) {
    return getInitials(listingUser.name ?? null);
  }

  return (
    <Card
      className="card-hover flex cursor-pointer flex-col border-border/70 bg-card/90"
      onClick={() => router.push(`/listing/${listing.id}`)}
    >
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-2 py-2">
          <Avatar className="size-9">
            <AvatarImage src={listing.user.avatar ?? undefined} />
            <AvatarFallback className="text-xs">
              {initials(listing.user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {listing.user.name ?? 'Unknown'}
            </p>
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
      </CardHeader>
      <CardContent className="pb-0 flex-1">
        <CardTitle className="text-base mb-2 line-clamp-2">
          {listing.title}
        </CardTitle>
        <Badge variant="outline" className="mb-3 border-primary/15 bg-primary/5 text-primary">
          {listing.category}
        </Badge>
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
      </CardContent>
      <CardFooter className="justify-between items-center pt-2 mt-auto">
        <SkillLevelIndicator level={listing.difficultyLevel} size="sm" />
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/listing/${listing.id}`);
          }}
        >
          View Details
          <ArrowRight className="size-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}