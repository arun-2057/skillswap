'use client';

import { useEffect, useState } from 'react';
import { useRouterStore } from '@/store/router-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { CreditBadge } from '@/components/common/credit-badge';
import {
  Coins,
  Search,
  BookOpen,
  CalendarCheck,
  ArrowRight,
  Users,
  TrendingUp,
} from 'lucide-react';

interface ListingCard {
  id: string;
  title: string;
  category: string;
  tags: string;
  creditCost: number;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number;
  };
}

export function HomePage() {
  const { navigate } = useRouterStore();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=6&sort=newest');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setListings(json.data);
          }
        }
      } catch {
        // Silently fail - homepage should still render
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Coins className="size-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Trade Skills, Not Money
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with skilled people in your community. Teach what you know,
            learn what you need — all using credits instead of cash.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate({ page: 'browse' })}>
              <Search className="size-4 mr-2" />
              Browse Skills
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ page: 'create-listing' })}
            >
              <BookOpen className="size-4 mr-2" />
              Share Your Skill
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three simple steps to start trading skills
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: 'Create a Listing',
              description:
                'List the skills you can teach. Set your credit price and availability.',
            },
            {
              icon: CalendarCheck,
              title: 'Book a Session',
              description:
                'Find a skill you want to learn and book a session at a convenient time.',
            },
            {
              icon: Coins,
              title: 'Exchange Skills',
              description:
                'Teach your skill, earn credits. Use credits to learn from others.',
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl border bg-card">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <item.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="border-t bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-1">Featured Skills</h2>
              <p className="text-muted-foreground">
                Latest listings from our community
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate({ page: 'browse' })}
              className="hidden sm:flex"
            >
              View All
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card p-6 space-y-4"
                >
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
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No listings yet. Be the first to share a skill!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => {
                  const tags: string[] = JSON.parse(listing.tags || '[]');
                  const initials = listing.user.name
                    ? listing.user.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U';

                  return (
                    <Card
                      key={listing.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        navigate({ page: 'listing', id: listing.id })
                      }
                    >
                      <CardHeader className="pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={listing.user.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {listing.user.name}
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
                      <CardContent className="pb-0">
                        <CardTitle className="text-base mb-2">
                          {listing.title}
                        </CardTitle>
                        <Badge variant="outline" className="mb-3">
                          {listing.category}
                        </Badge>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
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
                      <CardFooter className="justify-between items-center pt-2">
                        <CreditBadge amount={listing.creditCost} />
                        <Button size="sm" variant="ghost">
                          View Details
                          <ArrowRight className="size-3 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-center mt-8 sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => navigate({ page: 'browse' })}
                >
                  View All Skills
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Users, value: '2,500+', label: 'Active Users' },
              { icon: BookOpen, value: '1,200+', label: 'Skills Listed' },
              { icon: TrendingUp, value: '8,000+', label: 'Sessions Completed' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <stat.icon className="size-8 mx-auto text-muted-foreground" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
