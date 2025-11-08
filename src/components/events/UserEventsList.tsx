'use client';

import { useEffect, useState } from 'react';
import { Event, EventStatus, User, UserRole } from '@/lib/models';
import { Timestamp } from 'firebase/firestore';
import { EventRepository, UserRepository } from '@/lib/firebase/repositories';
import { Button } from '@/components/ui/button';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CalendarIcon, Edit, Eye, Trash2, Globe, Shield, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UserEventsListProps {
  userId: string;
  showSuccess?: (message: string, title?: string) => void;
  showError?: (message: string, title?: string) => void;
  searchTerm?: string;
  selectedCategory?: string | null;
}

export default function UserEventsList({ userId, showSuccess, showError, searchTerm, selectedCategory }: UserEventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminViewEnabled, setAdminViewEnabled] = useState(false);
  const { dialog, confirmDelete } = useConfirmationDialog();
  
  const formatDate = (date: Timestamp | string | undefined) => {
    if (!date) return 'N/A';
    const timestamp = typeof date === 'string'
      ? new Date(date)
      : (date as any)?.toDate?.() || new Date((date as any)?.seconds * 1000 || Date.now());

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // Fetch user data and determine if admin
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await UserRepository.getUserById(userId);
        if (userData) {
          setUser(userData);
          setIsAdmin(userData.role === UserRole.ADMIN);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Fetch events based on user role and admin view toggle
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let eventsResponse;
        
        if (isAdmin && adminViewEnabled) {
          // Admin users in admin view see all events
          eventsResponse = await EventRepository.getAllEvents();
        } else {
          // Regular users or admin users in regular view see only their own events
          eventsResponse = await EventRepository.getEventsByOrganizerId(userId);
        }
        
        setEvents(eventsResponse.documents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (userId && user) {
      fetchEvents();
    }
  }, [userId, user, isAdmin, adminViewEnabled]);

  // Filter events when search, location, or category changes
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(lowerSearchTerm) || 
        event.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(event => 
        event.categories?.some(cat => 
          cat.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedCategory]);

  // Function to publish a draft event
  const publishEvent = async (eventId: string) => {
    try {
      await EventRepository.updateEvent(eventId, {
        status: EventStatus.PUBLISHED,
        published: true
      });
      
      // Update the local state to reflect the change
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, status: EventStatus.PUBLISHED, published: true } 
            : event
        )
      );
      
      showSuccess?.('Event published successfully!', 'Published');
    } catch (err) {
      console.error('Error publishing event:', err);
      showError?.('Failed to publish event. Please try again.', 'Error');
    }
  };

  // Function to delete an event
  const deleteEvent = async (eventId: string) => {
    try {
      await EventRepository.deleteEvent(eventId);
      console.log('Event deleted successfully!');
      // Remove from state after deletion
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      showSuccess?.('Event deleted successfully!', 'Deleted');
    } catch (err) {
      console.error('Error deleting event:', err);
      showError?.('Failed to delete event. Please try again.', 'Error');
    }
  };

  // Function to handle delete with confirmation
  const handleDeleteEvent = (event: Event) => {
    confirmDelete(event.title, () => deleteEvent(event.id));
  };

  if (loading) {
    return <div className="text-center p-8">Loading your events...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          {isAdmin && adminViewEnabled ? 'No events found in the system.' : 'You haven\'t created any events yet.'}
        </p>
        {!(isAdmin && adminViewEnabled) && (
          <Link 
            href="/dashboard/event/new"
            className="mt-4 inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Your First Event
          </Link>
        )}
      </div>
    );
  }

  if (filteredEvents.length === 0 && (searchTerm || (selectedCategory && selectedCategory !== 'all'))) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No events match your current filters.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search terms or clear the filters to see more events.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {isAdmin && adminViewEnabled ? 'All Events' : 'Your Events'}
        </h3>
        <div className="flex items-center gap-3">
          {/* Admin View Toggle Button */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminViewEnabled(!adminViewEnabled)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                adminViewEnabled
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {adminViewEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <Shield className="w-4 h-4" />
                  Admin View
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <Shield className="w-4 h-4" />
                  Regular View
                </>
              )}
            </Button>
          )}
          
          {/* Admin View Indicator */}
          {isAdmin && adminViewEnabled && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-md text-sm font-medium">
              <Shield className="w-4 h-4" />
              Admin Mode
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-4">
        {(filteredEvents.length > 0 ? filteredEvents : events).map(event => (
          <div
            key={event.id}
            className="bg-background border rounded-lg overflow-hidden shadow-sm"
          >
            <div className="flex flex-col md:flex-row">
              {/* Event image */}
              <div className="w-full md:w-1/4 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
              {event.images && event.images.length > 0 ? (() => {
                const primaryImage = event.images.find(img => img.isPrimary)?.url || event.images[0]?.url;
                return primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No image</p>
                  </div>
                );
              })() : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No image</p>
                </div>
              )}

                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    event.status === EventStatus.PUBLISHED 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {event.status === EventStatus.PUBLISHED ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              
              {/* Event details */}
              <div className="p-4 flex-1 flex flex-col">
                <div>
                  <h4 className="font-semibold text-lg mb-1">{event.title}</h4>
                  <div className="flex items-center text-muted-foreground text-xs mb-2">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {formatDate(event.startDate)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {event.description}
                  </p>
                  {event.categories && event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-3">
                      {event.categories.map(category => (
                        <span 
                          key={category} 
                          className="bg-muted text-xs px-2 py-0.5 rounded"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Show organizer info for admin users in admin view */}
                  {isAdmin && adminViewEnabled && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Organizer:</span> {event.organizerId}
                    </div>
                  )}
                  
                  {/* Show registration info if registration is enabled */}
                  {event.registrationConfig?.enabled && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Registration:</span> Enabled
                      {event.registrationConfig.maxRegistrations && (
                        <span className="ml-1">(Max: {event.registrationConfig.maxRegistrations})</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* View public page button - only for published events */}
                      {event.status === EventStatus.PUBLISHED && (
                        <Link 
                          href={`/events/${event.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          View Live
                        </Link>
                      )}
                      
                      {/* Publish button - only for draft events and if user is admin in admin view or event owner */}
                      {event.status === EventStatus.DRAFT && ((isAdmin && adminViewEnabled) || event.organizerId === userId) && (
                        <Button
                          size="sm"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary/90"
                          onClick={() => publishEvent(event.id)}
                        >
                          <Eye className="h-4 w-4" />
                          Publish
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {/* View Registrations button - show for events with registration enabled */}
                      {event.registrationConfig?.enabled && ((isAdmin && adminViewEnabled) || event.organizerId === userId) && (
                        <Link 
                          href={`/dashboard/event/${event.id}/registrations`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20 rounded-md transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          Registrations
                        </Link>
                      )}
                      
                      {/* Edit button - show for admin in admin view or event owner */}
                      {((isAdmin && adminViewEnabled) || event.organizerId === userId) && (
                        <Link 
                          href={`/dashboard/event/${event.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      )}
                      
                      {/* Delete button - show for admin in admin view or event owner */}
                      {((isAdmin && adminViewEnabled) || event.organizerId === userId) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${
                            isAdmin && adminViewEnabled && event.organizerId !== userId
                              ? 'text-red-700 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30'
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20'
                          }`}
                          onClick={() => handleDeleteEvent(event)}
                          title={isAdmin && adminViewEnabled && event.organizerId !== userId ? 'Admin: Delete any event' : 'Delete your event'}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                          {isAdmin && adminViewEnabled && event.organizerId !== userId && (
                            <Shield className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {dialog}
    </>
  );
}