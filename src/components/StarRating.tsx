import { cn } from '../lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  className?: string;
  starClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function StarRating({
  rating,
  className,
  starClassName = 'w-3.5 h-3.5',
  activeClassName = 'text-[#C5A059] fill-[#C5A059]',
  inactiveClassName = 'text-[#1A1A1A]/10',
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            starClassName,
            i < rating ? activeClassName : inactiveClassName
          )}
        />
      ))}
    </div>
  );
}
