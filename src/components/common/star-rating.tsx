'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-7',
};

export function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const displayValue = hovered ?? rating;
        const filled = displayValue >= star;
        const halfFilled = !filled && displayValue >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={cn(
              'relative transition-colors',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            )}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(null)}
            onClick={() => interactive && onChange?.(star)}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
