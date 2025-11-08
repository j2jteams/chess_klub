'use client';

import { ArrowUpDown, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SortOption = 'date-asc' | 'date-desc' | 'relevance' | 'location';

interface SortOptionsProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: typeof Calendar }[] = [
  { value: 'date-asc', label: 'Date (Earliest)', icon: Calendar },
  { value: 'date-desc', label: 'Date (Latest)', icon: Calendar },
  { value: 'relevance', label: 'Relevance', icon: TrendingUp },
  { value: 'location', label: 'Location', icon: MapPin },
];

export default function SortOptions({ value, onChange }: SortOptionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <ArrowUpDown className="w-4 h-4" />
        Sort by:
      </span>
      <div className="flex gap-2 flex-wrap">
        {sortOptions.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(option.value)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

