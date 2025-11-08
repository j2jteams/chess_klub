'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  EventCard,
  EventCardSkeleton,
  ActiveFilters
} from '@/components/events';
import { Header, Footer } from '@/components/layout';
import { Event } from '@/lib/models';
import { EventRepository } from '@/lib/firebase/repositories';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [location, setLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch events function
  const fetchEvents = useCallback(async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('Fetching events, isInitial:', isInitial, 'lastDoc:', lastDoc ? 'exists' : 'none');
      
      const result = await EventRepository.getUpcomingEvents({
        limit: isInitial ? 30 : 9,
        startAfter: isInitial ? undefined : lastDoc || undefined,
        
      });
      
      console.log('Received events:', result.documents.length);
      
      if (result.documents.length === 0) {
        setHasMore(false);
      } else {
        setLastDoc(result.lastDoc);
        setEvents(prev => isInitial ? result.documents : [...prev, ...result.documents]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [lastDoc]);

  // Load initial events
  useEffect(() => {
    // Add a flag to prevent multiple calls
    let isActive = true;
    
    const loadEvents = async () => {
      // Only proceed if component is still mounted
      if (isActive) {
        await fetchEvents(true);
      }
    };
    
    loadEvents();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isActive = false;
    };
  }, []); // Remove fetchEvents dependency to prevent infinite loop

  // Filter events when search or location changes
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Filter by search term (enhanced: includes location fields)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(lowerSearchTerm) || 
        event.description.toLowerCase().includes(lowerSearchTerm) ||
        event.location.city.toLowerCase().includes(lowerSearchTerm) ||
        event.location.address.toLowerCase().includes(lowerSearchTerm) ||
        event.location.state?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by location - search ALL location fields
    if (location && location.trim()) {
      const lowerLocation = location.toLowerCase().trim();
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
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, location]);

  // Handle search
  const handleSearch = (searchTerm: string, location: string) => {
    setSearchTerm(searchTerm);
    setLocation(location);
  };

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      console.log('Loading more events...');
      fetchEvents(false);
    }
  }, [loadingMore, hasMore, fetchEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation and filtering */}
      <Header 
        activePage="events" 
        onSearch={handleSearch}
        initialLocation={location}
        initialSearchTerm={searchTerm}
      />

      <main>
        
        {/* Active Filters */}
        {(searchTerm || location) && (
          <section className="border-b bg-gray-50">
            <div className="container mx-auto px-4 max-w-7xl py-4">
              <ActiveFilters
                searchTerm={searchTerm}
                location={location}
                onClearSearch={() => setSearchTerm('')}
                onClearLocation={() => setLocation('')}
                onClearAll={() => {
                  setSearchTerm('');
                  setLocation('');
                }}
              />
            </div>
          </section>
        )}
        
        
        {/* Events section */}
        <section className="bg-white py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Error state */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 mb-6">
                <p>{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchEvents();
                  }}
                  className="text-sm font-medium mt-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}
            
            {/* Results info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-1">
                {!loading && `${filteredEvents.length} ${filteredEvents.length === 1 ? 'Event' : 'Events'} Found`}
              </h3>
            </div>
            
            {/* Event grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(9)
                  .fill(null)
                  .map((_, index) => <EventCardSkeleton key={index} />)
                }
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
                  Try adjusting your search or filters to find events
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setLocation('');
                  }}
                  className="text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
            
            {/* Load more */}
            {!loading && hasMore && filteredEvents.length > 0 && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Events'}
                </button>
              </div>
            )}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Array(3)
                  .fill(null)
                  .map((_, index) => <EventCardSkeleton key={`more-${index}`} />)
                }
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}