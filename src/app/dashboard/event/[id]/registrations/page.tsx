'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Settings, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { Header, Footer } from '@/components/layout';
import { EventRepository } from '@/lib/firebase/repositories';
import { Event } from '@/lib/models';
import RegistrationsTable from '@/components/events/RegistrationsTable';
import { useNotifications, NotificationContainer } from '@/components/ui/notification';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export default function EventRegistrationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, removeNotification, showError } = useNotifications();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = params.id as string;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const eventData = await EventRepository.getEventById(eventId);
        
        if (!eventData) {
          setError('Event not found');
          return;
        }

        // Check if user is the event organizer
        if (eventData.organizerId !== user.uid) {
          setError('You do not have permission to view registrations for this event');
          return;
        }

        // Check if registration is enabled
        if (!eventData.registrationConfig?.enabled) {
          setError('Registration is not enabled for this event');
          return;
        }

        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header activePage="dashboard" />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 max-w-md mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen">
        <Header activePage="dashboard" />
        
        <main className="container mx-auto px-4 py-16 text-center max-w-7xl">
          <h2 className="text-2xl font-bold mb-4">{error || 'Event not found'}</h2>
          <p className="text-muted-foreground mb-8">
            {error === 'You do not have permission to view registrations for this event' 
              ? 'Only event organizers can view registrations.'
              : error === 'Registration is not enabled for this event'
              ? 'This event does not have registration enabled.'
              : 'Sorry, we couldn\'t find the event you\'re looking for.'
            }
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const registrationDeadline = event.registrationConfig?.deadline;
  const hasDeadlinePassed = registrationDeadline 
    ? new Date() > (typeof registrationDeadline === 'string' 
        ? new Date(registrationDeadline)
        : (registrationDeadline as any)?.toDate?.() || new Date((registrationDeadline as any)?.seconds * 1000 || Date.now()))
    : false;

  return (
    <div className="min-h-screen">
      <Header activePage="dashboard" />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/dashboard/event/${eventId}`} className="hover:text-foreground">
            {event.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">Registrations</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href={`/dashboard/event/${eventId}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to event
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Event Registrations
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage registrations for <span className="font-medium">{event.title}</span>
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" asChild>
              <Link href={`/events/${eventId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                View Event
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/event/${eventId}`}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Event Info Card */}
        <div className="bg-muted/50 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Event Date</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(event.startDate)}
                {event.endDate && (
                  <span className="block">to {formatDate(event.endDate)}</span>
                )}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Registration Settings</h3>
              <div className="text-sm space-y-1">
                {event.registrationConfig?.maxRegistrations && (
                  <p className="text-muted-foreground">
                    Capacity: {event.registrationConfig.maxRegistrations} attendees
                  </p>
                )}
                {event.registrationConfig?.requireApproval && (
                  <p className="text-muted-foreground">
                    Requires approval
                  </p>
                )}
                {event.registrationConfig?.allowWaitlist && (
                  <p className="text-muted-foreground">
                    Waitlist enabled
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Registration Status</h3>
              <div className="text-sm">
                {registrationDeadline ? (
                  <div className={hasDeadlinePassed ? 'text-red-600' : 'text-muted-foreground'}>
                    <p>
                      Deadline: {formatDate(registrationDeadline)}
                    </p>
                    <p className="text-xs">
                      {hasDeadlinePassed ? 'Registration closed' : 'Registration open'}
                    </p>
                  </div>
                ) : (
                  <p className="text-green-600">
                    Registration open (no deadline)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <RegistrationsTable
          eventId={eventId}
          eventTitle={event.title}
          isEventOwner={true}
        />
      </main>
      
      <Footer />
      
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
      />
    </div>
  );
}