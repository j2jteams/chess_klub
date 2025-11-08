'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SearchFilters {
  query: string;
  location: string;
  startDate?: string;
  endDate?: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  showDateRange?: boolean;
}

export default function AdvancedSearch({ 
  onSearch, 
  initialFilters,
  showDateRange = true 
}: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [location, setLocation] = useState(initialFilters?.location || '');
  const [startDate, setStartDate] = useState(initialFilters?.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters?.endDate || '');
  const [showAdvanced, setShowAdvanced] = useState(!!(startDate || endDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query,
      location,
      startDate: showAdvanced ? startDate : undefined,
      endDate: showAdvanced ? endDate : undefined,
    });
  };

  const handleClear = () => {
    setQuery('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    onSearch({
      query: '',
      location: '',
    });
  };

  const hasFilters = query || location || startDate || endDate;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:gap-0 md:rounded-full md:overflow-hidden md:border md:shadow-sm">
          <div className="relative flex-1 md:border-r">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Search for events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 py-3 rounded-md border md:rounded-none md:border-none"
            />
          </div>
          <div className="relative flex-1 md:border-r">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Location (city, state, etc.)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 py-3 rounded-md border md:rounded-none md:border-none"
            />
          </div>
          <Button 
            type="submit"
            className="bg-primary text-primary-foreground font-medium py-3 px-8 rounded-md md:rounded-none"
          >
            Search
          </Button>
        </div>

        {/* Advanced Options */}
        {showDateRange && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {showAdvanced ? 'Hide' : 'Show'} Date Range
            </button>

            {showAdvanced && (
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Filters */}
        {hasFilters && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

