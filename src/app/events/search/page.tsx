'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  EventCard,
  EventCardSkeleton,
} from '@/components/events';
import { Header, Footer } from '@/components/layout';
import { Event } from '@/lib/models';
import { EventRepository } from '@/lib/firebase/repositories';
import AdvancedSearch, { SearchFilters } from '@/components/search/AdvancedSearch';
import SortOptions, { SortOption } from '@/components/search/SortOptions';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-asc');
  
  // Get initial filters from URL params
  const getInitialFilters = (): SearchFilters => ({
    query: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  });

  const [filters, setFilters] = useState<SearchFilters>(getInitialFilters());

  // Fetch and filter events
  const fetchAndFilterEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all published events
      const result = await EventRepository.getPublishedEvents({ limit: 1000 });
      let filtered = [...result.documents];

      // Apply text search
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filtered = filtered.filter(event => 
          event.title.toLowerCase().includes(lowerQuery) || 
          event.description.toLowerCase().includes(lowerQuery) ||
          event.location.city.toLowerCase().includes(lowerQuery) ||
          event.location.address.toLowerCase().includes(lowerQuery)
        );
      }

      // Apply location filter - search ALL location fields
      if (filters.location && filters.location.trim()) {
        const lowerLocation = filters.location.toLowerCase().trim();
        filtered = filtered.filter(event => {
          if (!event.location) return false;
          
          // Search in ALL location fields
          const searchFields = [
            event.location.address || '',
            event.location.city || '',
            event.location.state || '',
            event.location.country || '',
            event.location.postalCode || '',
            event.location.venueDetails || ''
          ];
          
          // Check if any location field contains the search term
          return searchFields.some(field => 
            field.toLowerCase().includes(lowerLocation)
          );
        });
      }

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter(event => {
          const eventStartDate = typeof event.startDate === 'string' 
            ? new Date(event.startDate) 
            : (event.startDate as any)?.toDate?.() || new Date(event.startDate);
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (eventStartDate < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (eventStartDate > endDate) return false;
          }
          
          return true;
        });
      }

      setEvents(filtered);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Sort events
  useEffect(() => {
    let sorted = [...events];

    switch (sortBy) {
      case 'date-asc':
        sorted.sort((a, b) => {
          const dateA = typeof a.startDate === 'string' 
            ? new Date(a.startDate).getTime()
            : (a.startDate as any)?.toDate?.()?.getTime() || 0;
          const dateB = typeof b.startDate === 'string' 
            ? new Date(b.startDate).getTime()
            : (b.startDate as any)?.toDate?.()?.getTime() || 0;
          return dateA - dateB;
        });
        break;
      case 'date-desc':
        sorted.sort((a, b) => {
          const dateA = typeof a.startDate === 'string' 
            ? new Date(a.startDate).getTime()
            : (a.startDate as any)?.toDate?.()?.getTime() || 0;
          const dateB = typeof b.startDate === 'string' 
            ? new Date(b.startDate).getTime()
            : (b.startDate as any)?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });
        break;
      case 'relevance':
        // Simple relevance: events matching query in title are more relevant
        if (filters.query) {
          const lowerQuery = filters.query.toLowerCase();
          sorted.sort((a, b) => {
            const aTitleMatch = a.title.toLowerCase().includes(lowerQuery);
            const bTitleMatch = b.title.toLowerCase().includes(lowerQuery);
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return 0;
          });
        }
        break;
      case 'location':
        // Sort by city name
        sorted.sort((a, b) => 
          a.location.city.localeCompare(b.location.city)
        );
        break;
    }

    setFilteredEvents(sorted);
  }, [events, sortBy, filters.query]);

  // Fetch events when filters change
  useEffect(() => {
    fetchAndFilterEvents();
  }, [fetchAndFilterEvents]);

  // Update URL when filters change
  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.location) params.set('location', newFilters.location);
    if (newFilters.startDate) params.set('startDate', newFilters.startDate);
    if (newFilters.endDate) params.set('endDate', newFilters.endDate);
    
    router.push(`/events/search?${params.toString()}`);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {
      query: '',
      location: '',
    };
    setFilters(emptyFilters);
    router.push('/events/search');
  };

  const hasActiveFilters = filters.query || filters.location || filters.startDate || filters.endDate;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activePage="events" 
        onSearch={(query, location) => handleSearch({ query, location })}
        initialLocation={filters.location}
        initialSearchTerm={filters.query}
      />

      <main>
        {/* Search Section */}
        <section className="bg-white border-b py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <h1 className="text-3xl font-bold mb-6">Search Events</h1>
            <AdvancedSearch 
              onSearch={handleSearch}
              initialFilters={filters}
              showDateRange={true}
            />
          </div>
        </section>

        {/* Active Filters & Sort */}
        {(hasActiveFilters || filteredEvents.length > 0) && (
          <section className="border-b bg-gray-50">
            <div className="container mx-auto px-4 max-w-7xl py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.query && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        Query: {filters.query}
                        <button
                          onClick={() => handleSearch({ ...filters, query: '' })}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {filters.location && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        Location: {filters.location}
                        <button
                          onClick={() => handleSearch({ ...filters, location: '' })}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {(filters.startDate || filters.endDate) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        Date: {filters.startDate || 'Any'} - {filters.endDate || 'Any'}
                        <button
                          onClick={() => handleSearch({ ...filters, startDate: undefined, endDate: undefined })}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-sm"
                    >
                      Clear All
                    </Button>
                  </div>
                )}

                {/* Sort Options */}
                {filteredEvents.length > 0 && (
                  <SortOptions value={sortBy} onChange={setSortBy} />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        <section className="bg-white py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Results Count */}
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                {loading ? 'Searching...' : `${filteredEvents.length} ${filteredEvents.length === 1 ? 'Event' : 'Events'} Found`}
              </h2>
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing results for your search criteria
                </p>
              )}
            </div>

            {/* Event Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(9).fill(null).map((_, index) => (
                  <EventCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Start searching to find events'}
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

