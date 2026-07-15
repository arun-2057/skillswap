'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { categories } from '@/lib/validators';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/common/star-rating';
import { SkillLevelIndicator } from '@/components/common/skill-level-indicator';
import { ListingCard } from '@/components/common/listing-card';
import { EmptyState } from '@/components/common/empty-state';
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface ListingRow {
  id: string;
  title: string;
  category: string;
  tags: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  description: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number;
  };
}

function skillLevelOf(raw: string): ListingRow['difficultyLevel'] {
  return ['beginner', 'intermediate', 'advanced', 'expert'].includes(raw)
    ? (raw as ListingRow['difficultyLevel'])
    : 'intermediate';
}

export function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const isMine = searchParams?.get('mine') === 'true';

  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const suggestedSearches = ['Python', 'Design', 'Spanish', 'Photography', 'React'];

  const fetchListings = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      setLoading(isLoadMore ? false : true);
      setLoadingMore(isLoadMore);

      try {
        const params = new URLSearchParams();
        params.set('limit', '12');
        params.set('sort', sortBy);
        if (searchQuery) params.set('search', searchQuery);
        if (categoryFilter) params.set('category', categoryFilter);
        if (cursor) params.set('cursor', cursor);
        const url = `/api/listings?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as {
            success: boolean;
            data: Array<{
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
            }>;
            hasMore: boolean;
            nextCursor?: string;
          };
          if (json.success) {
            const normalizedJsonData = json.data.map((item: any) => ({
              ...item,
              difficultyLevel: skillLevelOf(item.difficultyLevel),
            })) as ListingRow[];
            setListings((prev) => (isLoadMore ? [...prev, ...normalizedJsonData] : normalizedJsonData));
            setHasMore(json.hasMore);
            setNextCursor(json.nextCursor);
          }
        }
      } catch {
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, categoryFilter, sortBy]
  );

  useEffect(() => {
    const initial = () => fetchListings();
    initial();
  }, [fetchListings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchListings();
  }

  function clearFilters() {
    setSearchQuery('');
    setCategoryFilter('');
    setSortBy('newest');
  }

  const normalizedListings: ListingRow[] = listings.map((l) => ({
    ...l,
    difficultyLevel: skillLevelOf(l.difficultyLevel),
  }));

  const hasActiveFilters = Boolean(searchQuery || categoryFilter);

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {`${isMine ? 'My Listings' : 'Browse Skills'}`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isMine
            ? 'Manage your skill listings'
            : 'Discover skills to learn from our community'}
        </p>
        {!isMine && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <Compass className="size-3.5 text-primary" />
              Try one of these popular searches:
            </div>
            {suggestedSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSearchQuery(item);
                  fetchListings();
                }}
                className="rounded-full border bg-background px-2.5 py-1 text-xs transition hover:border-primary/40 hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <label htmlFor="global-search" className="sr-only">
            Search skills
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="global-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="pl-9 input-focus-ring"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2" aria-label="Open filters">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="flex size-2 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <div className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="category-filter" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="sort-select" className="text-sm font-medium">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button
                className="w-full"
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  fetchListings();
                }}
              >
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </form>

      {hasActiveFilters && (
        <div className="hidden sm:flex flex-wrap gap-1.5 mb-4">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: {searchQuery}
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="ml-0.5 hover:text-destructive"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {categoryFilter && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {categoryFilter}
              <button
                type="button"
                onClick={() => setCategoryFilter('')}
                className="ml-0.5 hover:text-destructive"
                aria-label="Clear category filter"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {!loading && !hasActiveFilters && !isMine && listings.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Popular matches are shown first. Use the filters to narrow by category or skill.
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
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
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title={isMine ? 'No listings yet' : 'No skills found'}
          description={
            isMine
              ? 'Share your skills with the community by creating your first listing.'
              : 'Try a broader search term, browse a category, or start with one of the suggested searches above.'
          }
          action={
            isMine
              ? { label: 'Create Listing', onClick: () => router.push('/create-listing') }
              : hasActiveFilters
                ? { label: 'Clear Filters', onClick: clearFilters }
                : { label: 'Create Listing', onClick: () => router.push('/create-listing') }
          }
        />
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {normalizedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => fetchListings(nextCursor)}
                disabled={loadingMore}
                aria-busy={loadingMore}
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}