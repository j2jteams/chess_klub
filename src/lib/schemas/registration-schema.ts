import { z } from 'zod';
import { 
  RegistrationFieldType, 
  RegistrationStatus 
} from '@/lib/models/registration';

/**
 * Schema for registration field configuration
 */
export const registrationFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  type: z.nativeEnum(RegistrationFieldType),
  label: z.string().min(1, 'Field label is required'),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean(),
  order: z.number().int().min(0),
  
  // Field-specific options
  options: z.array(z.string()).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  acceptedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().int().min(1).optional(),
  
  // Conditional logic
  showWhen: z.object({
    fieldId: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains']),
    value: z.union([z.string(), z.array(z.string())])
  }).optional()
}).refine((data) => {
  // Validate that select/radio/checkbox fields have options
  if ([RegistrationFieldType.SELECT, RegistrationFieldType.RADIO, RegistrationFieldType.CHECKBOX].includes(data.type)) {
    return data.options && data.options.length > 0;
  }
  return true;
}, {
  message: 'Select, radio, and checkbox fields must have options',
  path: ['options']
}).refine((data) => {
  // Validate min/max length consistency
  if (data.minLength !== undefined && data.maxLength !== undefined) {
    return data.minLength <= data.maxLength;
  }
  return true;
}, {
  message: 'Minimum length cannot be greater than maximum length',
  path: ['maxLength']
}).refine((data) => {
  // Validate min/max value consistency
  if (data.min !== undefined && data.max !== undefined) {
    return data.min <= data.max;
  }
  return true;
}, {
  message: 'Minimum value cannot be greater than maximum value',
  path: ['max']
});

/**
 * Schema for registration configuration
 */
export const registrationConfigSchema = z.object({
  enabled: z.boolean(),
  fields: z.array(registrationFieldSchema),
  deadline: z.union([z.string(), z.date()]).optional(),
  maxRegistrations: z.number().int().min(1).optional(),
  allowWaitlist: z.boolean(),
  requireApproval: z.boolean(),
  confirmationMessage: z.string().optional(),
  submissionMessage: z.string().optional(),
  
  // Email settings
  sendConfirmationEmail: z.boolean(),
  confirmationEmailSubject: z.string().optional(),
  confirmationEmailTemplate: z.string().optional()
}).refine((data) => {
  // Validate field IDs are unique
  if (data.fields && data.fields.length > 0) {
    const fieldIds = data.fields.map(field => field.id);
    const uniqueIds = new Set(fieldIds);
    return uniqueIds.size === fieldIds.length;
  }
  return true;
}, {
  message: 'Field IDs must be unique',
  path: ['fields']
});

/**
 * Base schema for registration form submission
 */
export const baseRegistrationFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Valid email is required')
});

/**
 * Schema for event registration data
 */
export const eventRegistrationSchema = z.object({
  id: z.string().min(1, 'Registration ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  userId: z.string().optional(),
  status: z.nativeEnum(RegistrationStatus),
  
  // Registration data - dynamic based on form configuration
  formData: z.record(z.string(), z.any()),
  
  // Metadata
  submittedAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  approvedAt: z.union([z.string(), z.date()]).optional(),
  approvedBy: z.string().optional(),
  
  // Required contact info
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  
  // Optional metadata
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  notes: z.string().optional()
});

/**
 * Schema for registration filter options
 */
export const registrationFilterSchema = z.object({
  status: z.union([
    z.nativeEnum(RegistrationStatus),
    z.array(z.nativeEnum(RegistrationStatus))
  ]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional()
}).refine((data) => {
  // Validate date range
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo;
  }
  return true;
}, {
  message: 'Start date cannot be after end date',
  path: ['dateTo']
});

/**
 * Function to create dynamic validation schema based on registration fields
 */
export function createDynamicRegistrationSchema(fields: any[]) {
  const dynamicFields: Record<string, z.ZodTypeAny> = {};
  
  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;
    
    switch (field.type) {
      case RegistrationFieldType.EMAIL:
        fieldSchema = z.string().email('Valid email is required');
        break;
        
      case RegistrationFieldType.PHONE:
        fieldSchema = z.string().regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Valid phone number is required');
        break;
        
      case RegistrationFieldType.NUMBER:
        let numberSchema = z.number();
        if (field.min !== undefined) numberSchema = numberSchema.min(field.min);
        if (field.max !== undefined) numberSchema = numberSchema.max(field.max);
        fieldSchema = numberSchema;
        break;
        
      case RegistrationFieldType.DATE:
        fieldSchema = z.union([z.string(), z.date()]);
        break;
        
      case RegistrationFieldType.URL:
        fieldSchema = z.string().url('Valid URL is required');
        break;
        
      case RegistrationFieldType.SELECT:
      case RegistrationFieldType.RADIO:
        fieldSchema = z.string();
        if (field.options && field.options.length > 0) {
          fieldSchema = z.enum(field.options as [string, ...string[]]);
        }
        break;
        
      case RegistrationFieldType.CHECKBOX:
        if (field.options && field.options.length > 0) {
          fieldSchema = z.array(z.enum(field.options as [string, ...string[]]));
        } else {
          fieldSchema = z.boolean();
        }
        break;
        
      case RegistrationFieldType.FILE:
        fieldSchema = z.any(); // File validation will be handled separately
        break;
        
      case RegistrationFieldType.TEXTAREA:
      case RegistrationFieldType.TEXT:
      default:
        let stringSchema = z.string();
        if (field.minLength !== undefined) {
          stringSchema = stringSchema.min(field.minLength, `Minimum ${field.minLength} characters required`);
        }
        if (field.maxLength !== undefined) {
          stringSchema = stringSchema.max(field.maxLength, `Maximum ${field.maxLength} characters allowed`);
        }
        fieldSchema = stringSchema;
        break;
    }
    
    // Make field optional if not required
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    dynamicFields[field.id] = fieldSchema;
  });
  
  return baseRegistrationFormSchema.extend(dynamicFields);
}

/**
 * Type definitions derived from schemas
 */
export type RegistrationFieldFormValues = z.infer<typeof registrationFieldSchema>;
export type RegistrationConfigFormValues = z.infer<typeof registrationConfigSchema>;
export type EventRegistrationFormValues = z.infer<typeof eventRegistrationSchema>;
export type RegistrationFilterFormValues = z.infer<typeof registrationFilterSchema>;
export type BaseRegistrationFormValues = z.infer<typeof baseRegistrationFormSchema>;

/**
 * Default values for forms
 */
export const defaultRegistrationField: RegistrationFieldFormValues = {
  id: '',
  type: RegistrationFieldType.TEXT,
  label: 'New Field',
  placeholder: 'Enter your response...',
  description: '',
  required: false,
  order: 0
};

export const defaultRegistrationConfig: RegistrationConfigFormValues = {
  enabled: false,
  fields: [],
  allowWaitlist: false,
  requireApproval: false,
  sendConfirmationEmail: true
};