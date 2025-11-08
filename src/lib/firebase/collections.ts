import { 
  User, 
  Organization, 
  Event, 
  Reminder, 
  Submission,
  EventRegistration
} from '@/lib/models';

/**
 * Firestore collection paths
 */
export const collections = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  EVENTS: 'events',
  REMINDERS: 'reminders',
  SUBMISSIONS: 'submissions',
} as const;

/**
 * Type to represent all Firestore collection names
 */
export type CollectionName = typeof collections[keyof typeof collections];

/**
 * Type to represent the document type for each collection
 */
export interface CollectionDocTypes {
  [collections.USERS]: User;
  [collections.ORGANIZATIONS]: Organization;
  [collections.EVENTS]: Event;
  [collections.REMINDERS]: Reminder;
  [collections.SUBMISSIONS]: Submission;
}

/**
 * Helper function to get the sub-collection path for event attendees
 */
export const getEventAttendeesCollection = (eventId: string) => 
  `${collections.EVENTS}/${eventId}/attendees`;

/**
 * Helper function to get the sub-collection path for event registrations
 */
export const getEventRegistrationsCollection = (eventId: string) => 
  `${collections.EVENTS}/${eventId}/registrations`;

/**
 * Interface for event attendee data stored in sub-collection
 */
export interface EventAttendee {
  userId: string;
  reminderSet: boolean;
  reminderTime?: Date | string;
  saved: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
}