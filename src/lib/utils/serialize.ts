import { Event } from '@/lib/models';
import { Timestamp } from 'firebase/firestore';

/**
 * Converts Firestore Timestamps to ISO strings for serialization
 */
export function serializeEvent(event: Event): Event {
  return {
    ...event,
    startDate: event.startDate instanceof Timestamp 
      ? event.startDate.toDate().toISOString()
      : event.startDate,
    endDate: event.endDate 
      ? (event.endDate instanceof Timestamp 
          ? event.endDate.toDate().toISOString()
          : event.endDate)
      : undefined,
    createdAt: event.createdAt instanceof Timestamp 
      ? event.createdAt.toDate().toISOString()
      : event.createdAt,
    updatedAt: event.updatedAt instanceof Timestamp 
      ? event.updatedAt.toDate().toISOString()
      : event.updatedAt,
  };
}