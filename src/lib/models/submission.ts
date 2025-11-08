import { Timestamp } from 'firebase/firestore';
import { ExtractedEventData } from './event';

/**
 * Submission model for tracking flyer submissions
 */
export interface Submission {
  id: string;
  submitterId?: string; // User ID (if known)
  submissionMethod: SubmissionMethod;
  submissionSource?: string; // email address, phone number, etc.
  status: SubmissionStatus;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  fileUrl: string;
  fileType: string;
  fileName?: string;
  extractedData?: ExtractedEventData;
  moderatorId?: string; // User ID who reviewed/approved
  moderatorNotes?: string;
  eventId?: string; // Created event ID after approval
}

/**
 * Method used to submit a flyer
 */
export enum SubmissionMethod {
  WEBSITE_UPLOAD = 'website_upload',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp'
}

/**
 * Status of a flyer submission
 */
export enum SubmissionStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  EXTRACTION_COMPLETED = 'extraction_completed',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FAILED = 'failed'
}