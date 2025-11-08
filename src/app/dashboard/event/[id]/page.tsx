'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NewEventForm from '@/components/events/NewEventForm';
import { Header, Footer } from '@/components/layout';
import { Event, EventStatus } from '@/lib/models';
import { EventRepository } from '@/lib/firebase/repositories';
import { EventFormValues } from '@/lib/schemas/event-schema';
import { Timestamp } from 'firebase/firestore';
import { useNotifications, NotificationContainer } from '@/components/ui/notification';
import { useAuth } from '@/lib/context/AuthContext';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifications, removeNotification, showSuccess, showError, showWarning } = useNotifications();

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !user) return;
      
      try {
        setIsLoading(true);
        const eventData = await EventRepository.getEventById(eventId);
        
        if (!eventData) {
          setError('Event not found');
          return;
        }
        
        // Check if user has permission to edit this event
        if (eventData.organizerId !== user.uid) {
          setError('You do not have permission to edit this event');
          return;
        }
        
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user]);

  /**
   * Convert Event model to form values
   */
  const convertEventToFormValues = (event: Event): EventFormValues => {
    // Helper function to format date for datetime-local input
    const formatDateForLocalInput = (date: Date): string => {
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    // Convert Timestamps to local time strings for form inputs
    const startDate = event.startDate ? 
      (typeof event.startDate === 'string' 
        ? event.startDate 
        : formatDateForLocalInput(new Date(event.startDate.seconds * 1000))
      ) : '';
    const endDate = event.endDate ? 
      (typeof event.endDate === 'string' 
        ? event.endDate 
        : formatDateForLocalInput(new Date(event.endDate.seconds * 1000))
      ) : '';

    return {
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      location: event.location,
      categories: event.categories,
      organizerId: event.organizerId,
      organizationId: event.organizationId || '',
      images: event.images || [],
      published: event.published || event.status === EventStatus.PUBLISHED,
      maxAttendees: event.maxAttendees,
      isFeaturedBanner: event.isFeaturedBanner || false,
      price: event.price || undefined,
      contactInfo: event.contactInfo || { email: '', phone: '', website: '' },
      registrationConfig: event.registrationConfig ? {
        ...event.registrationConfig,
        deadline: event.registrationConfig.deadline 
          ? (typeof event.registrationConfig.deadline === 'string' 
              ? new Date(event.registrationConfig.deadline)
              : new Date(event.registrationConfig.deadline.seconds * 1000))
          : undefined
      } : undefined,
    };
  };

  /**
   * Convert form values to Event model for update
   */
  const prepareEventUpdateData = (formData: EventFormValues): Partial<Event> => {
    // Convert date strings to Firestore Timestamps
    const startTimestamp = formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : undefined;
    const endTimestamp = formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : undefined;

    // Build update data object, excluding undefined values
    const updateData: Partial<Event> = {
      title: formData.title,
      description: formData.description,
      location: {
        address: formData.location.address || '',
        city: formData.location.city || '',
        country: formData.location.country || '',
        state: formData.location.state,
        postalCode: formData.location.postalCode,
        venueDetails: formData.location.venueDetails,
      },
      categories: formData.categories,
      images: formData.images || [],
      status: formData.published ? EventStatus.PUBLISHED : EventStatus.DRAFT,
      published: formData.published,
      isFeaturedBanner: formData.isFeaturedBanner || false,
      updatedAt: Timestamp.now(),
    };

    // Only add fields if they have valid values
    if (startTimestamp) {
      updateData.startDate = startTimestamp;
    }
    
    if (endTimestamp) {
      updateData.endDate = endTimestamp;
    }

    if (formData.maxAttendees !== undefined && formData.maxAttendees !== null) {
      updateData.maxAttendees = formData.maxAttendees;
    }

    if (formData.price && (formData.price.amount || formData.price.ticketUrl)) {
      updateData.price = {
        ...formData.price,
        amount: formData.price.amount || 0,
        ticketUrl: formData.price.ticketUrl || undefined
      };
      // Remove undefined ticketUrl if present
      if (updateData.price.ticketUrl === undefined) {
        delete updateData.price.ticketUrl;
      }
    }

    if (formData.contactInfo) {
      updateData.contactInfo = formData.contactInfo;
    }

    // Handle registration configuration
    if (formData.registrationConfig) {
      const registrationConfig: any = { ...formData.registrationConfig };
      
      // Convert deadline to Timestamp if it exists and it's a string
      if (registrationConfig.deadline && typeof registrationConfig.deadline === 'string') {
        registrationConfig.deadline = Timestamp.fromDate(new Date(registrationConfig.deadline));
      } else if (registrationConfig.deadline && registrationConfig.deadline instanceof Date) {
        registrationConfig.deadline = Timestamp.fromDate(registrationConfig.deadline);
      } else if (!registrationConfig.deadline) {
        // Remove undefined deadline
        delete registrationConfig.deadline;
      }
      
      // Remove undefined fields that Firestore doesn't accept
      if (registrationConfig.maxRegistrations === undefined || registrationConfig.maxRegistrations === null) {
        delete registrationConfig.maxRegistrations;
      }
      if (registrationConfig.confirmationMessage === undefined || registrationConfig.confirmationMessage === '') {
        delete registrationConfig.confirmationMessage;
      }
      if (registrationConfig.submissionMessage === undefined || registrationConfig.submissionMessage === '') {
        delete registrationConfig.submissionMessage;
      }
      if (registrationConfig.confirmationEmailSubject === undefined || registrationConfig.confirmationEmailSubject === '') {
        delete registrationConfig.confirmationEmailSubject;
      }
      if (registrationConfig.confirmationEmailTemplate === undefined || registrationConfig.confirmationEmailTemplate === '') {
        delete registrationConfig.confirmationEmailTemplate;
      }
      
      updateData.registrationConfig = registrationConfig;
    }

    return updateData;
  };

  const handleEventUpdate = async (formData: EventFormValues) => {
    if (!event) return;
    
    console.log('handleEventUpdate called with data:', formData);
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for Firestore
      const updateData = prepareEventUpdateData(formData);
      console.log('Prepared update data:', updateData);
      console.log('Registration config in update data:', updateData.registrationConfig);
      
      // Update event in Firestore
      await EventRepository.updateEvent(event.id, updateData);
      
      console.log('Event updated successfully');
      
      showSuccess('Event updated successfully!', 'Success');
      
      // Redirect to dashboard after update
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error('Error updating event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        console.error('Stack trace:', err.stack);
      }
      setError(`Failed to update event: ${errorMessage}`);
      showError(`Failed to update event: ${errorMessage}`, 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Header activePage="dashboard" />
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-muted-foreground">Loading event...</p>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  if (error || !event) {
    return (
      <ProtectedRoute>
        <Header activePage="dashboard" />
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-xl">😅</span>
                <span>{error}</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Header activePage="dashboard" />
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Mobile title */}
            <div className="block md:hidden">
              <div className="text-3xl mb-2">✏️</div>
              <h1 className="text-2xl font-bold sunset-text-gradient leading-tight mb-2">
                Edit Your<br />Amazing Event!
              </h1>
              <div className="text-3xl mb-4">✨</div>
            </div>
            
            {/* Desktop title */}
            <h1 className="hidden md:block text-4xl font-bold mb-4 sunset-text-gradient leading-tight">
              ✏️ Edit Your Amazing Event! ✨
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Update your event details and make it even better! 🎉
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 relative">
              <div className="flex items-center gap-2">
                <span className="text-xl">😅</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <NewEventForm 
            onSubmit={handleEventUpdate} 
            isSubmitting={isSubmitting}
            showError={showError}
            showWarning={showWarning}
            initialValues={convertEventToFormValues(event)}
            editMode={true}
          />
        </div>
      </div>
      <Footer />
      
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
      />
    </ProtectedRoute>
  );
}