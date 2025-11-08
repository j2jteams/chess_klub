'use client';

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface EventSearchProps {
  onSearch: (searchTerm: string, location: string) => void;
  initialSearchTerm?: string;
  initialLocation?: string;
}

export default function EventSearch({ 
  onSearch, 
  initialSearchTerm = '', 
  initialLocation = ''
}: EventSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [location, setLocation] = useState(initialLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm, location);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 md:flex-row md:gap-0 md:rounded-full md:overflow-hidden md:border md:shadow-sm"
      >
        <div className="relative flex-1 md:border-r">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search for events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-3 rounded-md border md:rounded-none md:border-none"
          />
        </div>
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 py-3 rounded-md border md:rounded-none md:border-none"
          />
        </div>
        <button 
          type="submit"
          className="bg-primary text-primary-foreground font-medium py-3 px-8 rounded-md md:rounded-none"
        >
          Search
        </button>
      </form>
    </div>
  );
}