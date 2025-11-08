import { z } from 'zod';
import { registrationConfigSchema } from './registration-schema';

// Define the base schema for event form validation
const baseEventFormSchema = z.object({
  // Basic Information
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100),
  description: z.string().min(1, { message: 'Tell us what makes this event special!' }),
  
  // Date and Time
  startDate: z.string()
    .refine(val => val.trim() !== '', {
      message: 'Start date is required'
    })
    .refine(val => {
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    }, {
      message: 'Please enter a valid start date and time'
    }),
  endDate: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true;
      try {
        const date = new Date(val);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    }, {
      message: 'Please enter a valid end date and time'
    })
    .optional(),
  
  // Location
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    venueDetails: z.string().optional(),
  }),
  
  // Categories and Tags (optional - no longer required)
  categories: z.array(z.string()).optional(),
  
  // Pricing (optional)
  price: z.object({
    freeEntry: z.boolean().default(false),
    amount: z.number().min(0).optional(),
    currency: z.string().default('USD'),
    ticketUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  }).optional(),
  
  // Contact Information (optional)
  contactInfo: z.object({
    name: z.string().optional(),
    email: z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
  }).optional(),
  
  // Images
  images: z.array(
    z.object({
      url: z.string().url({ message: 'Please enter a valid image URL' }).or(z.literal('')),
      isPrimary: z.boolean().default(false),
      alt: z.string().optional(),
    })
  ).default([]),
  
  // Organization association
  organizerId: z.string(), // This will be filled automatically from auth context
  organizationId: z.string().optional(),
  
  // Publication Settings
  published: z.boolean().default(false),
  maxAttendees: z.number().positive().optional(),
  
  // Admin Settings
  isFeaturedBanner: z.boolean().default(false).optional(),
  
  // Registration Configuration
  registrationConfig: registrationConfigSchema.optional(),
});

// Apply cross-field validation
export const eventFormSchema = baseEventFormSchema.refine((data) => {
  if (!data.endDate || data.endDate.trim() === '') return true;
  
  try {
    const endDate = new Date(data.endDate);
    const startDate = new Date(data.startDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return true;
    return endDate >= startDate;
  } catch {
    return true;
  }
}, {
  message: 'End date must be after start date',
  path: ['endDate']
});

// Type for the form data
export type EventFormValues = z.infer<typeof eventFormSchema>;

// Default values for the form
export const defaultEventFormValues: EventFormValues = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  location: {
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    venueDetails: '',
  },
  categories: [],
  price: {
    freeEntry: false,
    amount: 0,
    currency: 'USD',
    ticketUrl: '',
  },
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    website: '',
  },
  images: [
    {
      url: '',
      isPrimary: true,
      alt: '',
    }
  ],
  organizerId: '',
  organizationId: '',
  published: false,
  maxAttendees: undefined,
  isFeaturedBanner: false,
  registrationConfig: undefined,
};