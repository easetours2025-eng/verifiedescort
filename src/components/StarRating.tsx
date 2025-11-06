import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  totalReviews?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  totalReviews
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayRating;
          const isPartial = value === Math.ceil(displayRating) && displayRating % 1 !== 0;
          
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                'relative transition-transform',
                !readonly && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              aria-label={`Rate ${value} stars`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors',
                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                )}
              />
              {isPartial && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'absolute top-0 left-0 fill-yellow-400 text-yellow-400'
                  )}
                  style={{
                    clipPath: `inset(0 ${100 - (displayRating % 1) * 100}% 0 0)`
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
          {totalReviews !== undefined && (
            <span>({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;
