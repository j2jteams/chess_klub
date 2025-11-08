import { Event, EventStatus } from '@/lib/models';
import { collections, getEventAttendeesCollection, EventAttendee } from '../collections';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument,
  FetchOptions 
} from '../db';
import { 
  where, 
  Timestamp, 
  QueryConstraint, 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../config';
import { deleteEventImages } from '../storage';

/**
 * Repository for event-related database operations
 */
export const EventRepository = {
  /**
   * Create a new event
   */
  createEvent: async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createDocument<Event>(collections.EVENTS, data);
  },
  
  /**
   * Get an event by ID
   */
  getEventById: async (id: string) => {
    return getDocument<Event>(collections.EVENTS, id);
  },
  
  /**
   * Update an event
   */
  updateEvent: async (
    id: string, 
    data: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    return updateDocument<Event>(collections.EVENTS, id, data);
  },
  
  /**
   * Delete an event and its associated images from storage
   */
  deleteEvent: async (id: string) => {
    try {
      // First, get the event to retrieve image URLs
      const eventResponse = await getDocument<Event>(collections.EVENTS, id);
      const event = eventResponse;
      
      if (event) {
        // Collect all image URLs to delete
        const imageUrls: string[] = [];
        
        // Add event images
        if (event.images && event.images.length > 0) {
          event.images.forEach(image => {
            if (image.url) {
              imageUrls.push(image.url);
            }
          });
        }
        
        // Add flyer URL if it exists
        if (event.flyerUrl) {
          imageUrls.push(event.flyerUrl);
        }
        
        // Delete images from storage (don't wait for completion to avoid blocking)
        if (imageUrls.length > 0) {
          deleteEventImages(imageUrls).catch(error => {
            console.error('Error deleting event images:', error);
          });
        }
      }
      
      // Delete the event document from Firestore
      return deleteDocument(collections.EVENTS, id);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
  
  /**
   * Get all published events with pagination
   */
  getPublishedEvents: async (options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Get upcoming events (current and future events)
   */
  getUpcomingEvents: async (options: FetchOptions = {}) => {
    // Get all published events first, then filter by date in JavaScript
    // This handles the case where startDate might be stored as string instead of Timestamp
    const constraints: QueryConstraint[] = [
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    const result = await queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
    
    // Filter events to include current and upcoming ones
    // Show events that are happening today or in the future
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    const upcomingEvents = result.documents.filter(event => {
      const startDate = typeof event.startDate === 'string' 
        ? new Date(event.startDate)
        : (event.startDate as any)?.toDate?.() || new Date((event.startDate as any)?.seconds * 1000 || Date.now());
      
      // If event has an end date, check if it hasn't ended yet
      if (event.endDate) {
        const endDate = typeof event.endDate === 'string'
          ? new Date(event.endDate)
          : (event.endDate as any)?.toDate?.() || new Date((event.endDate as any)?.seconds * 1000 || Date.now());
        return endDate >= todayStart; // Show if event ends today or later
      }
      
      // If no end date, check if event starts today or later
      return startDate >= todayStart;
    });
    
    
    return {
      ...result,
      documents: upcomingEvents
    };
  },
  
  /**
   * Get events by organizer ID
   */
  getEventsByOrganizerId: async (organizerId: string, options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('organizerId', '==', organizerId)
    ];
    
    // Default to ordering by creation date
    const fetchOptions = {
      orderByField: 'createdAt',
      orderDirection: 'desc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Get events by organization ID
   */
  getEventsByOrganizationId: async (organizationId: string, options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('organizationId', '==', organizationId)
    ];
    
    // Default to ordering by creation date
    const fetchOptions = {
      orderByField: 'createdAt',
      orderDirection: 'desc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Get events by category
   */
  getEventsByCategory: async (category: string, options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('categories', 'array-contains', category),
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Get events by city
   */
  getEventsByCity: async (city: string, options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('location.city', '==', city),
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Get featured banner events
   */
  getFeaturedBannerEvents: async (options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('isFeaturedBanner', '==', true),
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },
  
  /**
   * Save an event for a user
   */
  saveEventForUser: async (eventId: string, userId: string) => {
    if (!db) throw new Error('Firebase not initialized');
    
    const attendeeCollection = getEventAttendeesCollection(eventId);
    const attendeeRef = doc(db, attendeeCollection, userId);
    const attendeeDoc = await getDoc(attendeeRef);
    
    if (attendeeDoc.exists()) {
      // Update existing attendee document
      await setDoc(attendeeRef, {
        saved: true,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } else {
      // Create new attendee document
      const attendeeData = {
        userId,
        saved: true,
        reminderSet: false,
        createdAt: Timestamp.now()
      };
      
      await setDoc(attendeeRef, attendeeData);
    }
  },
  
  /**
   * Unsave an event for a user
   */
  unsaveEventForUser: async (eventId: string, userId: string) => {
    if (!db) throw new Error('Firebase not initialized');
    
    const attendeeCollection = getEventAttendeesCollection(eventId);
    const attendeeRef = doc(db, attendeeCollection, userId);
    const attendeeDoc = await getDoc(attendeeRef);
    
    if (attendeeDoc.exists()) {
      // Update existing attendee document
      await setDoc(attendeeRef, {
        saved: false,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
  },
  
  /**
   * Check if a user has saved an event
   */
  isEventSavedByUser: async (eventId: string, userId: string): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');
    
    const attendeeCollection = getEventAttendeesCollection(eventId);
    const attendeeRef = doc(db, attendeeCollection, userId);
    const attendeeDoc = await getDoc(attendeeRef);
    
    if (attendeeDoc.exists()) {
      const data = attendeeDoc.data() as EventAttendee;
      return !!data.saved;
    }
    
    return false;
  },

  /**
   * Get all events for admin users
   */
  getAllEvents: async (options: FetchOptions = {}) => {
    // Default to ordering by creation date
    const fetchOptions = {
      orderByField: 'createdAt',
      orderDirection: 'desc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, [], fetchOptions);
  },

  /**
   * Increment view count for an event
   */
  incrementViewCount: async (eventId: string) => {
    if (!db) throw new Error('Firebase not initialized');
    
    try {
      const eventRef = doc(db, collections.EVENTS, eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const event = eventDoc.data() as Event;
        const currentViewCount = event.viewCount || 0;
        
        await setDoc(eventRef, {
          viewCount: currentViewCount + 1,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error to avoid blocking event viewing
    }
  },

  /**
   * Get events with registration enabled
   */
  getEventsWithRegistration: async (options: FetchOptions = {}) => {
    const constraints: QueryConstraint[] = [
      where('registrationConfig.enabled', '==', true),
      where('status', '==', EventStatus.PUBLISHED),
      where('published', '==', true)
    ];
    
    // Default to ordering by start date
    const fetchOptions = {
      orderByField: 'startDate',
      orderDirection: 'asc' as const,
      ...options
    };
    
    return queryDocuments<Event>(collections.EVENTS, constraints, fetchOptions);
  },

  /**
   * Check if an event has registration enabled and is accepting registrations
   */
  isRegistrationOpen: async (eventId: string): Promise<{ open: boolean; reason?: string }> => {
    try {
      const event = await EventRepository.getEventById(eventId);
      
      if (!event) {
        return { open: false, reason: 'Event not found' };
      }
      
      if (!event.registrationConfig?.enabled) {
        return { open: false, reason: 'Registration is not enabled for this event' };
      }
      
      // Check deadline
      if (event.registrationConfig.deadline) {
        const deadline = typeof event.registrationConfig.deadline === 'string' 
          ? new Date(event.registrationConfig.deadline)
          : (event.registrationConfig.deadline as any)?.toDate?.() || new Date((event.registrationConfig.deadline as any)?.seconds * 1000 || Date.now());
        
        if (new Date() > deadline) {
          return { open: false, reason: 'Registration deadline has passed' };
        }
      }
      
      return { open: true };
    } catch (error) {
      console.error('Error checking registration status:', error);
      return { open: false, reason: 'Unable to check registration status' };
    }
  },

  /**
   * Get events that the user has registered for
   */
  getUserRegisteredEvents: async (userId: string, options: FetchOptions = {}) => {
    // This is a placeholder implementation
    // In a real implementation, you might need to query across multiple subcollections
    // or maintain a separate collection for user registrations
    throw new Error('getUserRegisteredEvents not implemented - requires additional architecture');
  },

  /**
   * Update event registration configuration
   */
  updateRegistrationConfig: async (eventId: string, registrationConfig: any) => {
    return updateDocument<Event>(collections.EVENTS, eventId, {
      registrationConfig
    });
  }
};