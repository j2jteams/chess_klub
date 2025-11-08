import { Timestamp } from 'firebase/firestore';

/**
 * User model representing a registered user in the system
 */
export interface User {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  role?: UserRole; // Optional - new sign-ups have no role until owner promotes them
  organizationId?: string | null;
  preferences?: UserPreferences;
}

/**
 * Possible user roles in the system
 * Note: Public users don't need accounts - only Admin and Owner roles exist
 */
export enum UserRole {
  ADMIN = 'admin',     // Chess club admin (can create events)
  OWNER = 'owner'      // Chess club owner (can manage admins + create events)
}

/**
 * User preferences for notifications and content
 */
export interface UserPreferences {
  notificationMethods: NotificationMethod[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  location?: string;
  interests?: string[];
  savedEvents?: string[]; // Event IDs
  cachedLocation?: CachedLocationData;
}

/**
 * Cached location data from geocoding API
 */
export interface CachedLocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  locality?: string;
  principalSubdivision?: string;
  formattedLocation: string; // "City, State" format for display
  lastUpdated: Timestamp | string;
}

/**
 * Notification methods supported by the system
 */
export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp'
}

/**
 * Organization profile information
 */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  verified: boolean;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  adminIds: string[]; // User IDs of organization admins
}