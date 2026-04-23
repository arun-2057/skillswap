'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouterStore } from '@/store/router-store';
import { useAuthStore } from '@/store/auth-store';
import { categories } from '@/lib/validators';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/common/star-rating';
import { CreditBadge } from '@/components/common/credit-badge';
import { EmptyState } from '@/components/common/empty-state';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';

interface ListingCard {
  id: string;
  title: string;
  category: string;
  tags: string;
  creditCost: number;
  description: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    averageRating: number;
  };
}

export function BrowsePage() {
  const { route, navigate } = useRouterStore();
  const { isAuthenticated } = useAuthStore();
  const isMine = route.page === 'browse' && route.params?.mine === 'true';

  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [minCredits, setMinCredits] = useState('');
  const [maxCredits, setMaxCredits] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchListings = useCallback(
    async (cursor?: string) => {
      const isLoadMore = !!cursor;
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('limit', '12');
        params.set('sort', sortBy);
        if (searchQuery) params.set('search', searchQuery);
        if (categoryFilter) params.set('category', categoryFilter);
        if (minCredits) params.set('minCredits', minCredits);
        if (maxCredits) params.set('maxCredits', maxCredits);
        if (cursor) params.set('cursor', cursor);

        const url = isMine ? `/api/listings?${params.toString()}` : `/api/listings?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (isLoadMore) {
              setListings((prev) => [...prev, ...json.data]);
            } else {
              setListings(json.data);
            }
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
    [searchQuery, categoryFilter, minCredits, maxCredits, sortBy, isMine]
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchListings();
  }

  function clearFilters() {
    setSearchQuery('');
    setCategoryFilter('');
    setMinCredits('');
    setMaxCredits('');
    setSortBy('newest');
  }

  function renderListingCard(listing: ListingCard) {
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
      <div
        key={listing.id}
        className="rounded-xl border bg-card p-6 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate({ page: 'listing', id: listing.id })}
      >
        {/* Teacher */}
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

        {/* Title & Category */}
        <div>
          <h3 className="font-semibold mb-1.5 line-clamp-2">{listing.title}</h3>
          <Badge variant="outline" className="text-xs">
            {listing.category}
          </Badge>
        </div>

        {/* Tags */}
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

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <CreditBadge amount={listing.creditCost} />
          <Button size="sm" variant="ghost">
            View Details
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    searchQuery || categoryFilter || minCredits || maxCredits;

  return (
    <div className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isMine ? 'My Listings' : 'Browse Skills'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isMine
            ? 'Manage your skill listings'
            : 'Discover skills to learn from our community'}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for skills..."
            className="pl-9"
          />
        </div>
        {/* Desktop filters trigger */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="flex size-2 rounded-full bg-primary" />
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
                <label className="text-sm font-medium">Category</label>
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
                <label className="text-sm font-medium">Credit Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Min"
                    value={minCredits}
                    onChange={(e) => setMinCredits(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Max"
                    value={maxCredits}
                    onChange={(e) => setMaxCredits(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="highest_rated">Highest Rated</SelectItem>
                    <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button
                className="w-full"
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

      {/* Active filter chips (desktop) */}
      {hasActiveFilters && (
        <div className="hidden sm:flex flex-wrap gap-1.5 mb-4">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')}>
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {categoryFilter && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {categoryFilter}
              <button onClick={() => setCategoryFilter('')}>
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {minCredits && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Min: {minCredits}
              <button onClick={() => setMinCredits('')}>
                <X className="size-3" />
              </button>
            </Badge>
          )}
          {maxCredits && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Max: {maxCredits}
              <button onClick={() => setMaxCredits('')}>
                <X className="size-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
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
              : 'Try adjusting your search or filters to find what you\'re looking for.'
          }
          action={
            isMine
              ? { label: 'Create Listing', onClick: () => navigate({ page: 'create-listing' }) }
              : hasActiveFilters
                ? { label: 'Clear Filters', onClick: clearFilters }
                : { label: 'Create Listing', onClick: () => navigate({ page: 'create-listing' }) }
          }
        />
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {listings.map(renderListingCard)}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => fetchListings(nextCursor)}
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
