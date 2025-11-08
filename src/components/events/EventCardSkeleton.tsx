'use client';

import { cn } from '@/lib/utils';

interface EventCardSkeletonProps {
  featured?: boolean;
}

export default function EventCardSkeleton({ featured = false }: EventCardSkeletonProps) {
  return (
    <div 
      className={cn(
        "bg-background border rounded-lg overflow-hidden shadow-sm animate-pulse",
        featured && "md:col-span-2 md:flex md:h-64"
      )}
    >
      <div 
        className={cn(
          "relative h-64 bg-muted",
          featured && "md:h-64 md:w-1/2"
        )}
      />
      
      <div className={cn(
        "p-4",
        featured && "md:w-1/2 md:p-6"
      )}>
        {/* Title */}
        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
        
        {/* Description */}
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3 mb-3"></div>
        
        {/* Date */}
        <div className="h-3 bg-muted rounded w-1/3 mb-2"></div>
        
        {/* Location */}
        <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
        
        {featured && (
          <div className="mt-4 h-4 bg-muted rounded w-1/4"></div>
        )}
      </div>
    </div>
  );
}