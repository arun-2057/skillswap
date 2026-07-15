'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';

interface SearchResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  relevance: number;
}

interface SearchBoxProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
  showResults?: boolean;
}

export function SearchBox({
  placeholder = 'Search skills, users, conversations...',
  className = '',
  onResultSelect,
  showResults = true,
}: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'listings' | 'users' | 'conversations' | 'all'>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const search = useCallback(async (searchQuery: string, type: string = 'all') => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: type === 'all' ? '' : type,
        limit: '5',
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.data.results || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query, selectedType);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, selectedType, search]);

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigate to the result
      if (result.id.startsWith('list_')) {
        router.push(`/listing/${result.id.replace('list_', '')}`);
      } else if (result.id.startsWith('user_')) {
        router.push(`/profile/${result.id.replace('user_', '')}`);
      } else if (result.id.startsWith('conv_')) {
        router.push(`/messages?conversationId=${result.id}`);
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'listings':
        return '📚';
      case 'users':
        return '👤';
      case 'conversations':
        return '💬';
      default:
        return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'listings':
        return 'Skills';
      case 'users':
        return 'People';
      case 'conversations':
        return 'Messages';
      default:
        return 'All';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {(['all', 'listings', 'users', 'conversations'] as const).map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="text-xs"
          >
            {getTypeIcon(type)} {getTypeLabel(type)}
          </Button>
        ))}
      </div>

      {/* Search results dropdown */}
      {showResults && showDropdown && (query.length >= 2 || loading) && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-96">
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex-shrink-0">
                      {result.title ? '📚' : result.name ? '👤' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {result.title || result.name}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.description}
                      </p>
                      {result.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : query.length >= 2 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}