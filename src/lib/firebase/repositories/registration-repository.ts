import { 
  EventRegistration, 
  RegistrationStatus,
  RegistrationFilter,
  RegistrationStats
} from '@/lib/models';
import { getEventRegistrationsCollection } from '../collections';
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
  setDoc,
  query,
  collection,
  getDocs,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config';

/**
 * Repository for event registration operations
 */
export const RegistrationRepository = {
  /**
   * Create a new registration for an event
   */
  createRegistration: async (
    eventId: string, 
    data: Omit<EventRegistration, 'id' | 'submittedAt' | 'updatedAt'>
  ) => {
    console.log('🏗️ RegistrationRepository.createRegistration called');
    console.log('📝 Event ID:', eventId);
    console.log('📄 Input data:', data);
    
    const registrationData = {
      ...data,
      eventId,
      submittedAt: Timestamp.now()
    };
    
    console.log('📦 Final registration data:', registrationData);
    
    const collectionPath = getEventRegistrationsCollection(eventId);
    console.log('📁 Collection path:', collectionPath);
    console.log('💾 Calling createDocument with collection:', collectionPath);
    const result = await createDocument<EventRegistration>(collectionPath, registrationData);
    console.log('✅ Registration document created:', result);
    return result;
  },

  /**
   * Get a registration by ID
   */
  getRegistrationById: async (eventId: string, registrationId: string) => {
    const collectionPath = getEventRegistrationsCollection(eventId);
    return getDocument<EventRegistration>(collectionPath, registrationId);
  },

  /**
   * Update a registration
   */
  updateRegistration: async (
    eventId: string,
    registrationId: string,
    data: Partial<Omit<EventRegistration, 'id' | 'eventId' | 'submittedAt'>>
  ) => {
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    
    const collectionPath = getEventRegistrationsCollection(eventId);
    return updateDocument<EventRegistration>(collectionPath, registrationId, updateData);
  },

  /**
   * Delete a registration
   */
  deleteRegistration: async (eventId: string, registrationId: string) => {
    const collectionPath = getEventRegistrationsCollection(eventId);
    return deleteDocument(collectionPath, registrationId);
  },

  /**
   * Get all registrations for an event with filtering and pagination
   */
  getEventRegistrations: async (
    eventId: string, 
    filter: RegistrationFilter = {},
    options: FetchOptions = {}
  ) => {
    if (!db) throw new Error('Firebase not initialized');
    
    const constraints: QueryConstraint[] = [];
    
    // Add status filter
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        constraints.push(where('status', 'in', filter.status));
      } else {
        constraints.push(where('status', '==', filter.status));
      }
    }
    
    // Add date filters
    if (filter.dateFrom) {
      constraints.push(where('submittedAt', '>=', Timestamp.fromDate(filter.dateFrom)));
    }
    
    if (filter.dateTo) {
      const endOfDay = new Date(filter.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      constraints.push(where('submittedAt', '<=', Timestamp.fromDate(endOfDay)));
    }
    
    // Default ordering
    const fetchOptions = {
      orderByField: 'submittedAt',
      orderDirection: 'desc' as const,
      ...options
    };
    
    const collectionPath = getEventRegistrationsCollection(eventId);
    const result = await queryDocuments<EventRegistration>(collectionPath, constraints, fetchOptions);
    
    // Apply search filter in JavaScript if provided
    if (filter.search && filter.search.trim()) {
      const searchTerm = filter.search.toLowerCase().trim();
      const filteredDocuments = result.documents.filter(registration => {
        return (
          registration.firstName.toLowerCase().includes(searchTerm) ||
          registration.lastName.toLowerCase().includes(searchTerm) ||
          registration.email.toLowerCase().includes(searchTerm)
        );
      });
      
      return {
        ...result,
        documents: filteredDocuments
      };
    }
    
    return result;
  },

  /**
   * Get registration statistics for an event
   */
  getRegistrationStats: async (eventId: string): Promise<RegistrationStats> => {
    if (!db) throw new Error('Firebase not initialized');
    
    const collectionPath = getEventRegistrationsCollection(eventId);
    const registrationsRef = collection(db, collectionPath);
    
    try {
      const snapshot = await getDocs(registrationsRef);
      const stats: RegistrationStats = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        waitlisted: 0,
        cancelled: 0
      };
      
      snapshot.forEach((doc) => {
        const registration = doc.data() as EventRegistration;
        stats.total++;
        
        switch (registration.status) {
          case RegistrationStatus.APPROVED:
            stats.approved++;
            break;
          case RegistrationStatus.PENDING:
            stats.pending++;
            break;
          case RegistrationStatus.REJECTED:
            stats.rejected++;
            break;
          case RegistrationStatus.WAITLISTED:
            stats.waitlisted++;
            break;
          case RegistrationStatus.CANCELLED:
            stats.cancelled++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting registration stats:', error);
      throw error;
    }
  },

  /**
   * Get registrations by user ID across all events
   */
  getUserRegistrations: async (userId: string, options: FetchOptions = {}) => {
    // Note: This requires a composite index on userId and submittedAt
    // For now, we'll implement this by querying individual event collections
    // In a production app, you might want to maintain a separate user registrations collection
    throw new Error('getUserRegistrations not implemented - requires additional architecture');
  },

  /**
   * Check if a user is registered for an event
   */
  isUserRegistered: async (eventId: string, userId: string): Promise<boolean> => {
    if (!db || !userId) return false;
    
    try {
      const result = await RegistrationRepository.getEventRegistrations(eventId, {}, { limit: 1000 });
      return result.documents.some(registration => 
        registration.userId === userId && 
        registration.status !== RegistrationStatus.CANCELLED
      );
    } catch (error) {
      console.error('Error checking user registration:', error);
      return false;
    }
  },

  /**
   * Get user's registration for a specific event
   */
  getUserRegistrationForEvent: async (eventId: string, userId: string): Promise<EventRegistration | null> => {
    if (!db || !userId) return null;
    
    try {
      const result = await RegistrationRepository.getEventRegistrations(eventId, {}, { limit: 1000 });
      const userRegistration = result.documents.find(registration => 
        registration.userId === userId && 
        registration.status !== RegistrationStatus.CANCELLED
      );
      
      return userRegistration || null;
    } catch (error) {
      console.error('Error getting user registration:', error);
      return null;
    }
  },

  /**
   * Update registration status
   */
  updateRegistrationStatus: async (
    eventId: string,
    registrationId: string,
    status: RegistrationStatus,
    approvedBy?: string,
    notes?: string
  ) => {
    const updateData: Partial<EventRegistration> = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (status === RegistrationStatus.APPROVED && approvedBy) {
      updateData.approvedAt = Timestamp.now();
      updateData.approvedBy = approvedBy;
    }
    
    if (notes) {
      updateData.notes = notes;
    }
    
    return RegistrationRepository.updateRegistration(eventId, registrationId, updateData);
  },

  /**
   * Bulk update registration statuses
   */
  bulkUpdateRegistrations: async (
    eventId: string,
    registrationIds: string[],
    status: RegistrationStatus,
    approvedBy?: string
  ) => {
    const promises = registrationIds.map(id => 
      RegistrationRepository.updateRegistrationStatus(eventId, id, status, approvedBy)
    );
    
    return Promise.all(promises);
  },

  /**
   * Get registrations that need approval
   */
  getPendingRegistrations: async (eventId: string, options: FetchOptions = {}) => {
    return RegistrationRepository.getEventRegistrations(
      eventId,
      { status: RegistrationStatus.PENDING },
      options
    );
  },

  /**
   * Export registrations data for an event
   */
  exportRegistrations: async (eventId: string, filter: RegistrationFilter = {}) => {
    const result = await RegistrationRepository.getEventRegistrations(eventId, filter, { limit: 10000 });
    
    // Convert to exportable format
    return result.documents.map(registration => ({
      id: registration.id,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      status: registration.status,
      submittedAt: registration.submittedAt,
      approvedAt: registration.approvedAt,
      ...registration.formData // Include custom form fields
    }));
  },

  /**
   * Check if registration is still open for an event
   */
  isRegistrationOpen: async (eventId: string, registrationConfig: any): Promise<{ open: boolean; reason?: string }> => {
    if (!registrationConfig?.enabled) {
      return { open: false, reason: 'Registration is disabled for this event' };
    }
    
    // Check deadline
    if (registrationConfig.deadline) {
      const deadline = typeof registrationConfig.deadline === 'string' 
        ? new Date(registrationConfig.deadline)
        : (registrationConfig.deadline as any)?.toDate?.() || new Date((registrationConfig.deadline as any)?.seconds * 1000 || Date.now());
      
      if (new Date() > deadline) {
        return { open: false, reason: 'Registration deadline has passed' };
      }
    }
    
    // Check capacity
    if (registrationConfig.maxRegistrations) {
      const stats = await RegistrationRepository.getRegistrationStats(eventId);
      if (stats.approved >= registrationConfig.maxRegistrations) {
        if (registrationConfig.allowWaitlist) {
          return { open: true, reason: 'Waitlist available' };
        } else {
          return { open: false, reason: 'Event is at capacity' };
        }
      }
    }
    
    return { open: true };
  }
};