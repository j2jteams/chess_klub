'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import EventFormWizard from '@/components/events/EventFormWizard';
import { Header } from '@/components/layout';
import { Event, EventStatus } from '@/lib/models';
import { EventRepository } from '@/lib/firebase/repositories';
import { EventFormValues } from '@/lib/schemas/event-schema';
import { Timestamp } from 'firebase/firestore';
import { useNotifications, NotificationContainer } from '@/components/ui/notification';

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notifications, removeNotification, showSuccess, showError, showWarning } = useNotifications();

  /**
   * Convert form values to Event model
   */
  const prepareEventData = (formData: EventFormValues): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> => {
    // Convert date strings to Firestore Timestamps
    const startTimestamp = formData.startDate ? Timestamp.fromDate(new Date(formData.startDate)) : Timestamp.now();
    const endTimestamp = formData.endDate ? Timestamp.fromDate(new Date(formData.endDate)) : undefined;

    return {
      title: formData.title,
      description: formData.description,
      startDate: startTimestamp,
      endDate: endTimestamp,
      location: {
        address: formData.location.address || '',
        city: formData.location.city || '',
        country: formData.location.country || '',
        state: formData.location.state,
        postalCode: formData.location.postalCode,
        venueDetails: formData.location.venueDetails,
      },
      categories: formData.categories,
      organizerId: formData.organizerId,
      organizationId: formData.organizationId,
      images: formData.images || [],
      status: formData.published ? EventStatus.PUBLISHED : EventStatus.DRAFT,
      published: formData.published,
      maxAttendees: formData.maxAttendees,
      isFeaturedBanner: formData.isFeaturedBanner,
      price: formData.price ? {
        ...formData.price,
        amount: formData.price.amount || 0,
        ticketUrl: formData.price.ticketUrl || undefined
      } : undefined,
      contactInfo: formData.contactInfo,
      registrationConfig: formData.registrationConfig ? {
        ...formData.registrationConfig,
        deadline: formData.registrationConfig.deadline 
          ? (formData.registrationConfig.deadline instanceof Date 
              ? Timestamp.fromDate(formData.registrationConfig.deadline)
              : formData.registrationConfig.deadline)
          : undefined
      } : undefined,
    };
  };

  const handleEventSubmit = async (formData: EventFormValues) => {
    console.log('🎯 handleEventSubmit called with form data:', formData);
    console.log('📋 Registration config from form:', formData.registrationConfig);
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data for Firestore
      const eventData = prepareEventData(formData);
      console.log('📦 Prepared event data for Firestore:', eventData);
      console.log('🔍 Does eventData include registrationConfig?', !!eventData.registrationConfig);
      
      // Create event in Firestore
      const createdEvent = await EventRepository.createEvent(eventData);
      
      console.log('Event created successfully:', createdEvent);
      
      showSuccess('Event created successfully!', 'Success');
      
      // Redirect to dashboard after submission
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error('Error submitting event:', err);
      setError('Failed to submit event. Please try again.');
      showError('Failed to submit event. Please check the console for details.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header activePage="dashboard" />
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">😅</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <EventFormWizard 
        onSubmit={handleEventSubmit} 
        isSubmitting={isSubmitting}
        showError={showError}
        showWarning={showWarning}
      />
      
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
      />
    </ProtectedRoute>
  );
}