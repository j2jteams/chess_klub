import { Timestamp } from 'firebase/firestore';
import { NotificationMethod } from './user';

/**
 * Reminder model for event notifications
 */
export interface Reminder {
  id: string;
  userId: string;
  eventId: string;
  reminderTime: Timestamp;
  notificationMethods: NotificationMethod[];
  status: ReminderStatus;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  message?: string;
  customData?: Record<string, unknown>;
}

/**
 * Possible statuses for a reminder
 */
export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}