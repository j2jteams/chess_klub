'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  EventCard,
  EventCardSkeleton,
  ActiveFilters,
  BannerEvent
} from '@/components/events';
import { Header, Footer } from '@/components/layout';
import { EventRepository } from '@/lib/firebase/repositories';
import { Event } from '@/lib/models';
import { serializeEvent } from '@/lib/utils/serialize';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';



export default function Home() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  
  // Fetch featured banner events
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setIsLoadingFeatured(true);
        const result = await EventRepository.getFeaturedBannerEvents({ limit: 10 });
        setFeaturedEvents(result.documents);
      } catch (error) {
        console.error('Error fetching featured events:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Fetch published events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch upcoming events for homepage
        const eventsResult = await EventRepository.getUpcomingEvents({ 
          limit: 30
        });
        
        setEvents(eventsResult.documents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Filter events when search or location changes
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    // Start with all events
    let filtered = [...events];
    
    // If no filters, show all events
    if (!searchTerm && !location) {
      setFilteredEvents(filtered);
      return;
    }
    
    // Filter by search term (enhanced: includes location fields)
    if (searchTerm && searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(lowerSearchTerm) || 
        event.description.toLowerCase().includes(lowerSearchTerm) ||
        (event.location?.city?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (event.location?.address?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (event.location?.state?.toLowerCase() || '').includes(lowerSearchTerm)
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
  
  
  // Handle search - immediately update state to trigger filtering
  const handleSearch = (searchTerm: string, location: string) => {
    // Update both states immediately - this will trigger the filter effect
    setSearchTerm(searchTerm || '');
    setLocation(location || '');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with integrated search */}
      <Header 
        activePage="home" 
        onSearch={handleSearch}
        initialLocation={location}
        initialSearchTerm={searchTerm}
      />
      
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
      
      {/* Promotional Banner */}
      {/* <section className="bg-gradient-to-r from-green-50 to-green-100 border-b">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-8">
              <span className="font-medium text-gray-800">
                Ramesh bhai is hosting music festival this weekend. Don&apos;t miss out!
              </span>
            </div>
          </div>
        </div>
      </section> */}

      <main>
        
        {/* Main content section */}
        <section className="bg-white py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Trending in {location} 
                <ChevronDown className="inline h-5 w-5 ml-1" />
              </h2>
            </div>
            
            {/* Featured Banner Events */}
            {!isLoadingFeatured && featuredEvents.length > 0 && (
              <div className="mb-8">
                <BannerEvent events={featuredEvents.map(event => serializeEvent(event))} />
              </div>
            )}


            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(30)
                  .fill(null)
                  .map((_, index) => <EventCardSkeleton key={index} />)
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Try Again
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-4">No events found.</p>
                  <Link
                    href="/dashboard/event/new"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Create First Event
                  </Link>
                </div>
              ) : filteredEvents.length === 0 && (searchTerm || location) ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-4">No events match your current filters.</p>
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your search terms or clear the filters to see more events.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setLocation('');
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 mt-4"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                // Always use filteredEvents if there are any filters active, otherwise use all events
                ((searchTerm || location) && filteredEvents.length === 0) ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground mb-4">No events match your current filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setLocation('');
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 mt-4"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  (filteredEvents.length > 0 ? filteredEvents : events).map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                    />
                  ))
                )
              )}
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/events"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All Events
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}