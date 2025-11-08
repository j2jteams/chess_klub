'use client';

import { X } from 'lucide-react';

interface ActiveFiltersProps {
  searchTerm?: string;
  location?: string;
  onClearSearch?: () => void;
  onClearLocation?: () => void;
  onClearAll?: () => void;
}

export function ActiveFilters({
  searchTerm,
  location,
  onClearSearch,
  onClearLocation,
  onClearAll
}: ActiveFiltersProps) {
  const hasFilters = searchTerm || location;
  
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Active filters:</span>
      
      {searchTerm && (
        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
          <span>Search: &quot;{searchTerm}&quot;</span>
          {onClearSearch && (
            <button 
              onClick={onClearSearch}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      
      {location && (
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          <span>Location: {location}</span>
          {onClearLocation && (
            <button 
              onClick={onClearLocation}
              className="hover:bg-blue-100 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
      
      {onClearAll && (
        <button 
          onClick={onClearAll}
          className="text-primary hover:underline ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}