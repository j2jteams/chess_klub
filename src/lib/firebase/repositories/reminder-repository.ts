import { Reminder, ReminderStatus } from '@/lib/models';
import { collections, getEventAttendeesCollection } from '../collections';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument 
} from '../db';
import { where, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config';

/**
 * Repository for reminder-related database operations
 */
export const ReminderRepository = {
  /**
   * Create a new reminder
   */
  createReminder: async (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Firebase not initialized');
    
    // Create the reminder
    const reminder = await createDocument<Reminder>(collections.REMINDERS, data);
    
    // Update the event attendee record
    const attendeeCollection = getEventAttendeesCollection(data.eventId);
    const attendeeRef = doc(db, attendeeCollection, data.userId);
    const attendeeDoc = await getDoc(attendeeRef);
    
    if (attendeeDoc.exists()) {
      // Update existing attendee document
      await setDoc(attendeeRef, {
        reminderSet: true,
        reminderTime: data.reminderTime,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } else {
      // Create new attendee document
      const attendeeData = {
        userId: data.userId,
        reminderSet: true,
        reminderTime: data.reminderTime,
        saved: false,
        createdAt: Timestamp.now()
      };
      
      await setDoc(attendeeRef, attendeeData);
    }
    
    return reminder;
  },
  
  /**
   * Get a reminder by ID
   */
  getReminderById: async (id: string) => {
    return getDocument<Reminder>(collections.REMINDERS, id);
  },
  
  /**
   * Update a reminder
   */
  updateReminder: async (
    id: string, 
    data: Partial<Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    // If updating the reminder time, also update the event attendee record
    if (data.reminderTime) {
      const reminder = await getDocument<Reminder>(collections.REMINDERS, id);
      
      if (reminder) {
        if (!db) throw new Error('Firebase not initialized');
        
        const attendeeCollection = getEventAttendeesCollection(reminder.eventId);
        const attendeeRef = doc(db, attendeeCollection, reminder.userId);
        
        await setDoc(attendeeRef, {
          reminderTime: data.reminderTime,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    }
    
    return updateDocument<Reminder>(collections.REMINDERS, id, data);
  },
  
  /**
   * Delete a reminder
   */
  deleteReminder: async (id: string) => {
    // Get the reminder first to update the event attendee record
    const reminder = await getDocument<Reminder>(collections.REMINDERS, id);
    
    if (reminder) {
      if (!db) throw new Error('Firebase not initialized');
      
      const attendeeCollection = getEventAttendeesCollection(reminder.eventId);
      const attendeeRef = doc(db, attendeeCollection, reminder.userId);
      
      await setDoc(attendeeRef, {
        reminderSet: false,
        reminderTime: null,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
    
    return deleteDocument(collections.REMINDERS, id);
  },
  
  /**
   * Get reminders by user ID
   */
  getRemindersByUserId: async (userId: string) => {
    const { documents } = await queryDocuments<Reminder>(
      collections.REMINDERS,
      [where('userId', '==', userId)],
      { orderByField: 'reminderTime', orderDirection: 'asc' }
    );
    
    return documents;
  },
  
  /**
   * Get reminders by event ID
   */
  getRemindersByEventId: async (eventId: string) => {
    const { documents } = await queryDocuments<Reminder>(
      collections.REMINDERS,
      [where('eventId', '==', eventId)],
      { orderByField: 'reminderTime', orderDirection: 'asc' }
    );
    
    return documents;
  },
  
  /**
   * Get reminders due for sending
   */
  getDueReminders: async () => {
    const now = Timestamp.now();
    
    const { documents } = await queryDocuments<Reminder>(
      collections.REMINDERS,
      [
        where('reminderTime', '<=', now),
        where('status', '==', ReminderStatus.PENDING)
      ],
      { orderByField: 'reminderTime', orderDirection: 'asc' }
    );
    
    return documents;
  },
  
  /**
   * Mark a reminder as sent
   */
  markReminderAsSent: async (id: string) => {
    return updateDocument<Reminder>(collections.REMINDERS, id, {
      status: ReminderStatus.SENT
    });
  },
  
  /**
   * Mark a reminder as failed
   */
  markReminderAsFailed: async (id: string) => {
    return updateDocument<Reminder>(collections.REMINDERS, id, {
      status: ReminderStatus.FAILED
    });
  }
};