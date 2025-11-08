import { Timestamp } from 'firebase/firestore';
import { RegistrationConfig } from './registration';

/**
 * Event model representing a local event
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp | string;
  endDate?: Timestamp | string;
  location: EventLocation;
  organizerId: string; // User ID of creator
  organizationId?: string; // Organization ID if applicable
  categories?: string[]; // Optional - no longer required for chess club events
  images: EventImage[];
  flyerUrl?: string; // URL to original flyer image
  status: EventStatus;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  published: boolean;
  maxAttendees?: number;
  price?: EventPrice;
  contactInfo?: EventContactInfo;
  viewCount?: number; // Number of times this event has been viewed
  metadata?: Record<string, unknown>; // Additional extracted metadata
  isFeaturedBanner?: boolean; // Whether this event is featured as the main banner (admin only)
  
  // Registration configuration
  registrationConfig?: RegistrationConfig;
}

/**
 * Location details for an event
 */
export interface EventLocation {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  venueDetails?: string;
  geoPoint?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Images associated with an event
 */
export interface EventImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  width?: number;
  height?: number;
}

/**
 * Price information for an event
 */
export interface EventPrice {
  amount: number;
  currency: string;
  freeEntry: boolean;
  ticketUrl?: string;
}

/**
 * Contact information for an event
 */
export interface EventContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    other?: string;
  };
}

/**
 * Possible statuses for an event
 */
export enum EventStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

/**
 * Interface representing an extracted event from a flyer
 * This is a partial event with fields that might be extracted from OCR
 */
export interface ExtractedEventData {
  title?: string;
  description?: string;
  startDate?: Timestamp | string;
  endDate?: Timestamp | string;
  location?: Partial<EventLocation>;
  categories?: string[];
  price?: Partial<EventPrice>;
  contactInfo?: Partial<EventContactInfo>;
  confidence?: number; // Confidence score of extraction
  rawText?: string; // Original text extracted from flyer
}