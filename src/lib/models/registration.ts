import { Timestamp } from 'firebase/firestore';

/**
 * Types of registration fields that can be configured
 */
export enum RegistrationFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  FILE = 'file',
  URL = 'url'
}

/**
 * Configuration for a single registration field
 */
export interface RegistrationField {
  id: string;
  type: RegistrationFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  order: number;
  
  // Field-specific options
  options?: string[]; // For select, radio, checkbox fields
  minLength?: number; // For text fields
  maxLength?: number; // For text fields
  min?: number; // For number/date fields
  max?: number; // For number/date fields
  acceptedFileTypes?: string[]; // For file fields
  maxFileSize?: number; // For file fields (in bytes)
  
  // Conditional logic
  showWhen?: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains';
    value: string | string[];
  };
}

/**
 * Configuration for event registration
 */
export interface RegistrationConfig {
  enabled: boolean;
  fields: RegistrationField[];
  deadline?: Timestamp | string;
  maxRegistrations?: number;
  allowWaitlist: boolean;
  requireApproval: boolean;
  confirmationMessage?: string;
  submissionMessage?: string;
  
  // Email settings
  sendConfirmationEmail: boolean;
  confirmationEmailSubject?: string;
  confirmationEmailTemplate?: string;
}

/**
 * Status of a registration
 */
export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WAITLISTED = 'waitlisted',
  CANCELLED = 'cancelled'
}

/**
 * Individual user registration for an event
 */
export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string; // Optional - for anonymous registrations
  status: RegistrationStatus;
  
  // Registration data
  formData: Record<string, any>; // Dynamic form data based on configuration
  
  // Metadata
  submittedAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  approvedAt?: Timestamp | string;
  approvedBy?: string; // User ID of approver
  
  // Contact info (required fields)
  email: string;
  firstName: string;
  lastName: string;
  
  // Optional metadata
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  notes?: string; // Admin/organizer notes
}

/**
 * Registration statistics for an event
 */
export interface RegistrationStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  waitlisted: number;
  cancelled: number;
}

/**
 * Form values for registration submission
 */
export interface RegistrationFormValues {
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: any; // Dynamic fields based on configuration
}

/**
 * Registration form validation errors
 */
export interface RegistrationFormErrors {
  [fieldId: string]: string[];
}

/**
 * Export format options for registration data
 */
export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

/**
 * Filter options for registration queries
 */
export interface RegistrationFilter {
  status?: RegistrationStatus | RegistrationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search in name, email, etc.
}