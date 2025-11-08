'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  RegistrationFieldType,
  RegistrationConfig,
  RegistrationStatus,
  EventRegistration
} from '@/lib/models/registration';
import { Event } from '@/lib/models/event';
import {
  createDynamicRegistrationSchema,
  BaseRegistrationFormValues
} from '@/lib/schemas/registration-schema';
import { RegistrationRepository } from '@/lib/firebase/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notification';
import { cn } from '@/lib/utils';

interface EventRegistrationFormProps {
  event: Event;
  onRegistrationComplete?: (registration: EventRegistration) => void;
  onClose?: () => void;
}

const FieldRenderer = ({ 
  field, 
  formField, 
  errors 
}: { 
  field: any; 
  formField: any; 
  errors: any;
}) => {
  const { value, onChange } = formField;

  switch (field.type) {
    case RegistrationFieldType.TEXT:
      return (
        <Input
          {...formField}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
        />
      );

    case RegistrationFieldType.TEXTAREA:
      return (
        <Textarea
          {...formField}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          className="min-h-[100px]"
        />
      );

    case RegistrationFieldType.EMAIL:
      return (
        <Input
          type="email"
          {...formField}
          placeholder={field.placeholder || 'your@email.com'}
        />
      );

    case RegistrationFieldType.PHONE:
      return (
        <Input
          type="tel"
          {...formField}
          placeholder={field.placeholder || '+1 (555) 123-4567'}
        />
      );

    case RegistrationFieldType.NUMBER:
      return (
        <Input
          type="number"
          {...formField}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
        />
      );

    case RegistrationFieldType.DATE:
      return (
        <Input
          type="date"
          {...formField}
          min={field.min}
          max={field.max}
        />
      );

    case RegistrationFieldType.URL:
      return (
        <Input
          type="url"
          {...formField}
          placeholder={field.placeholder || 'https://example.com'}
        />
      );

    case RegistrationFieldType.SELECT:
      return (
        <select
          {...formField}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select an option...</option>
          {field.options?.map((option: string, index: number) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case RegistrationFieldType.RADIO:
      return (
        <div className="space-y-2">
          {field.options?.map((option: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${field.id}_${index}`}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4"
              />
              <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
            </div>
          ))}
        </div>
      );

    case RegistrationFieldType.CHECKBOX:
      if (field.options && field.options.length > 0) {
        // Multiple checkboxes
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${field.id}_${index}`}
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== option));
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      } else {
        // Single checkbox
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );
      }

    case RegistrationFieldType.FILE:
      return (
        <Input
          type="file"
          accept={field.acceptedFileTypes?.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Check file size
              if (field.maxFileSize && file.size > field.maxFileSize) {
                const maxSizeMB = field.maxFileSize / (1024 * 1024);
                errors[field.id] = [`File size must be less than ${maxSizeMB}MB`];
                return;
              }
              onChange(file);
            }
          }}
        />
      );

    default:
      return <Input {...formField} placeholder={field.placeholder} />;
  }
};

export default function EventRegistrationForm({ 
  event, 
  onRegistrationComplete, 
  onClose 
}: EventRegistrationFormProps) {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{
    open: boolean;
    reason?: string;
  } | null>(null);

  const registrationConfig = event.registrationConfig;



  // Create dynamic schema based on registration fields
  const schema = registrationConfig?.fields 
    ? createDynamicRegistrationSchema(registrationConfig.fields)
    : createDynamicRegistrationSchema([]);

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      ...registrationConfig?.fields?.reduce((acc, field) => {
        acc[field.id] = field.type === RegistrationFieldType.CHECKBOX && field.options ? [] : '';
        return acc;
      }, {} as Record<string, any>)
    }
  });

  // Check registration status on component mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!registrationConfig) {
        setRegistrationStatus({ open: false, reason: 'Registration is not enabled for this event' });
        return;
      }

      const status = await RegistrationRepository.isRegistrationOpen(event.id, registrationConfig);
      setRegistrationStatus(status);
    };

    checkRegistrationStatus();
  }, [event.id, registrationConfig]);

  const onSubmit = async (data: BaseRegistrationFormValues & Record<string, any>) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log('⚠️ Form already submitting, ignoring duplicate submission');
      return;
    }
    console.log('🚀 REGISTRATION FORM SUBMISSION STARTED');
    console.log('📊 Form data received:', data);
    console.log('⚙️ Registration config:', registrationConfig);
    console.log('🔓 Registration status:', registrationStatus);

    if (!registrationConfig || !registrationStatus?.open) {
      console.log('❌ Registration not available - config:', !!registrationConfig, 'status open:', registrationStatus?.open);
      showError('Registration is not available for this event', 'Registration Closed');
      return;
    }

    setIsSubmitting(true);
    console.log('📝 Starting registration submission...');

    try {
      // Check if user is already registered (only if logged in)
      // For anonymous registrations, we'll check by email instead
      if (user?.uid) {
        console.log('👤 Checking if user is already registered - user ID:', user.uid);
        const existingRegistration = await RegistrationRepository.getUserRegistrationForEvent(
          event.id, 
          user.uid
        );
        console.log('📋 Existing registration check result:', existingRegistration);
        
        if (existingRegistration) {
          console.log('⚠️ User already registered, stopping submission');
          showWarning('You are already registered for this event', 'Already Registered');
          setIsSubmitting(false);
          return;
        }
      } else {
        // For anonymous users, check by email
        console.log('👤 Checking if email is already registered - email:', data.email);
        // Note: This would require a new method in RegistrationRepository to check by email
        // For now, we'll allow multiple registrations with same email (could be different people)
      }

      // Prepare registration data
      const registrationData: Omit<EventRegistration, 'id' | 'submittedAt' | 'updatedAt'> = {
        eventId: event.id,
        userId: user?.uid,
        status: registrationConfig.requireApproval 
          ? RegistrationStatus.PENDING 
          : RegistrationStatus.APPROVED,
        formData: data,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        ipAddress: undefined, // This would be set server-side in a real app
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined
      };

      console.log('📦 Prepared registration data:', registrationData);

      // Check if waitlist is needed
      console.log('📊 Getting registration stats for capacity check...');
      const stats = await RegistrationRepository.getRegistrationStats(event.id);
      console.log('📈 Registration stats:', stats);
      console.log('🎯 Max registrations:', registrationConfig.maxRegistrations);
      
      if (registrationConfig.maxRegistrations && 
          stats.approved >= registrationConfig.maxRegistrations) {
        if (registrationConfig.allowWaitlist) {
          console.log('📋 Event at capacity, adding to waitlist');
          registrationData.status = RegistrationStatus.WAITLISTED;
        } else {
          console.log('❌ Event at capacity, no waitlist allowed');
          showError('This event is at capacity and waitlist is not available', 'Event Full');
          setIsSubmitting(false);
          return;
        }
      }

      // Create registration with timeout for Safari
      console.log('💾 Calling RegistrationRepository.createRegistration with:', {
        eventId: event.id,
        registrationData: registrationData
      });
      
      // Create registration with timeout for Safari
type CreatedRegistration = { id: string }; // what we need from the repo response

const registrationPromise: Promise<CreatedRegistration> =
  RegistrationRepository.createRegistration(event.id, registrationData);

// Make timeout a Promise<never> so it doesn't pollute the race type
const timeoutPromise: Promise<never> = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Registration timeout - please try again')), 30000);
});

// Now TS knows "registration" has an "id"
const registration = await Promise.race<CreatedRegistration>([
  registrationPromise,
  timeoutPromise,
]);

console.log('✅ Registration created successfully:', registration);


      // Show success message
      const message = registrationData.status === RegistrationStatus.WAITLISTED
        ? 'You have been added to the waitlist. We\'ll notify you if a spot opens up.'
        : registrationConfig.requireApproval
        ? 'Your registration has been submitted and is pending approval.'
        : registrationConfig.confirmationMessage || 'Registration successful! You\'re all set.';

      showSuccess(message, 'Registration Complete');

      // Call completion callback
      if (onRegistrationComplete && registration) {
        onRegistrationComplete({
          ...registrationData,
          id: registration.id,
          submittedAt: new Date().toISOString()
        } as EventRegistration);
      }

      // Close form
      if (onClose) {
        setTimeout(onClose, 2000);
      }

    } catch (error) {
      console.error('❌ Registration submission error:', error);
      console.error('📊 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error && error.message.includes('permission')
        ? 'Registration failed due to permissions. Please try again or contact support.'
        : 'Failed to submit registration. Please try again.';
      
      showError(errorMessage, 'Registration Error');
    } finally {
      console.log('🏁 Registration submission completed');
      setIsSubmitting(false);
    }
  };

  if (!registrationConfig?.enabled) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Registration Not Available</h3>
        <p className="text-muted-foreground">
          Registration is not enabled for this event.
        </p>
      </div>
    );
  }

  if (registrationStatus && !registrationStatus.open) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Registration Closed</h3>
        <p className="text-muted-foreground">
          {registrationStatus.reason}
        </p>
      </div>
    );
  }

  const sortedFields = registrationConfig.fields
    .sort((a, b) => a.order - b.order)
    .filter(field => {
      // Handle conditional logic
      if (field.showWhen) {
        const dependentFieldValue = form.watch(field.showWhen.fieldId as any);
        switch (field.showWhen.operator) {
          case 'equals':
            return dependentFieldValue === field.showWhen.value;
          case 'not_equals':
            return dependentFieldValue !== field.showWhen.value;
          case 'contains':
            return Array.isArray(dependentFieldValue) 
              ? dependentFieldValue.includes(field.showWhen.value)
              : false;
          case 'not_contains':
            return Array.isArray(dependentFieldValue)
              ? !dependentFieldValue.includes(field.showWhen.value)
              : true;
          default:
            return true;
        }
      }
      return true;
    });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Register for {event.title}</h2>
        <p className="text-muted-foreground">
          {registrationConfig.submissionMessage || 'Please fill out the form below to register for this event.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your first name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your last name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} placeholder="your@email.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Fields */}
          {sortedFields.map((field) => (
            <FormField
              key={field.id}
              control={form.control}
              name={field.id as any}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>
                    {field.label}
                    {field.required && ' *'}
                  </FormLabel>
                  <FormControl>
                    <FieldRenderer 
                      field={field} 
                      formField={formField}
                      errors={form.formState.errors}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                registrationConfig.requireApproval ? 'Submit for Review' : 'Register Now'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}