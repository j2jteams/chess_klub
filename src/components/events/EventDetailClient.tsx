'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Heart,
  Share2,
  User,
  Mail,
  Phone,
  Globe,
  X,
  ZoomIn,
  Eye,
  ExternalLink,
  Copy,
  Navigation
} from 'lucide-react';

import { useAuth } from '@/lib/context/AuthContext';
import {
  EventRepository,
  ReminderRepository,
  RegistrationRepository
} from '@/lib/firebase/repositories';
import {
  Event,
  Reminder,
  ReminderStatus,
  NotificationMethod
} from '@/lib/models';
import { RegistrationStats } from '@/lib/models/registration';
import { formatDate, cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import {
  useNotifications,
  NotificationContainer
} from '@/components/ui/notification';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { LinkifiedText } from '@/components/ui/linkified-text';
import EventRegistrationForm from '@/components/events/EventRegistrationForm';

interface EventDetailClientProps {
  event: Event;
  eventId: string;
}

export default function EventDetailClient({
  event,
  eventId
}: EventDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError
  } = useNotifications();
  const { dialog, confirmAction } = useConfirmationDialog();

  const [isSaved, setIsSaved] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationStats, setRegistrationStats] =
    useState<RegistrationStats | null>(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  // ---------- Helpers: Calendar / Reminders ----------
  const createCalendarData = () => {
    if (!event) return null;

    const startDate =
      typeof event.startDate === 'string'
        ? new Date(event.startDate)
        : (event.startDate as any)?.toDate?.() || new Date((event.startDate as any)?.seconds * 1000 || Date.now());

    const endDate = event.endDate
      ? typeof event.endDate === 'string'
        ? new Date(event.endDate)
        : (event.endDate as any)?.toDate?.() || new Date((event.endDate as any)?.seconds * 1000 || Date.now())
      : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateForCalendar = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const location = `${event.location.venueDetails || 'Venue'}, ${
      event.location.address || ''
    }, ${event.location.city || ''}, ${event.location.state || ''} ${
      event.location.postalCode || ''
    }, ${event.location.country || ''}`.trim();

    return {
      title: event.title,
      description: (event.description || '').replace(/\n/g, '\\n'),
      location,
      startDate: formatDateForCalendar(startDate),
      endDate: formatDateForCalendar(endDate)
    };
  };

  const buildIcsContent = (c: {
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
  }) => `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ChessKlub//EN
BEGIN:VEVENT
UID:${eventId}@chessklub.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${c.startDate}
DTEND:${c.endDate}
SUMMARY:${c.title}
DESCRIPTION:${c.description}
LOCATION:${c.location}
END:VEVENT
END:VCALENDAR`;

  const handleAddToCalendar = () => {
    const c = createCalendarData();
    if (!c) return;

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      c.title
    )}&dates=${c.startDate}/${c.endDate}&details=${encodeURIComponent(
      c.description
    )}&location=${encodeURIComponent(c.location)}`;

    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      c.title
    )}&startdt=${c.startDate}&enddt=${c.endDate}&body=${encodeURIComponent(
      c.description
    )}&location=${encodeURIComponent(c.location)}`;

    confirmAction(
      'Choose a calendar:',
      () => {
        window.open(googleUrl, '_blank');
        showSuccess('Opened Google Calendar.', 'Added to Calendar');
      },
      'Google Calendar'
    );

    // Keep other options available (can add UI buttons if needed)
    window.setTimeout(() => {
      // window.open(outlookUrl, '_blank');
    }, 0);
  };

  const handleEmailReminder = () => {
    // Reminders require authentication (admin/owner feature)
    // For now, we'll allow it but could add a note that it's for registered users
    setShowReminderDialog(true);
  };

  const handleSetReminder = async (hours: number, label: string) => {
    if (!user || !event) return;

    try {
      const eventStart =
        typeof event.startDate === 'string'
          ? new Date(event.startDate)
          : (event.startDate as any)?.toDate?.() || new Date((event.startDate as any)?.seconds * 1000 || Date.now());

      const reminderTime = new Date(
        eventStart.getTime() - hours * 60 * 60 * 1000
      );

      if (reminderTime <= new Date()) {
        showError('Cannot set reminder for past time.', 'Invalid time');
        return;
      }

      const reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        eventId,
        reminderTime: Timestamp.fromDate(reminderTime),
        notificationMethods: [NotificationMethod.EMAIL],
        status: ReminderStatus.PENDING,
        message: `Don't forget! "${event.title}" is starting in ${label}.`
      };

      await ReminderRepository.createReminder(reminder);
      showSuccess(`Email reminder set for ${label}.`, 'Reminder set');
      setShowReminderDialog(false);
    } catch (e) {
      console.error(e);
      showError('Failed to set reminder. Please try again.', 'Error');
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    const run = async () => {
      try {
        EventRepository.incrementViewCount(eventId);

        if (user?.uid) {
          const saved = await EventRepository.isEventSavedByUser(
            eventId,
            user.uid
          );
          setIsSaved(saved);
        }

        if (event.registrationConfig?.enabled) {
          try {
            const stats = await RegistrationRepository.getRegistrationStats(
              eventId
            );
            setRegistrationStats(stats);

            if (user?.uid) {
              const registered = await RegistrationRepository.isUserRegistered(
                eventId,
                user.uid
              );
              setIsUserRegistered(registered);
            }
          } catch (regErr) {
            console.error('Registration stats error:', regErr);
          }
        }
      } catch (err) {
        console.error('Event extra data error:', err);
      }
    };

    run();
  }, [eventId, user?.uid, event.registrationConfig?.enabled]);

  // ---------- Actions ----------
  const handleSaveEvent = async () => {
    // Save event feature - for now, we'll disable it since public users don't have accounts
    // This could be implemented later with local storage or email-based saving
    if (!user) {
      // Could show a message: "Sign in to save events" or use local storage
      return;
    }

    try {
      if (isSaved) {
        await EventRepository.unsaveEventForUser(eventId, user.uid);
      } else {
        await EventRepository.saveEventForUser(eventId, user.uid);
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareEvent = async () => {
    const shareData = {
      title: event?.title || 'Chess Klub',
      text: event?.description || 'Check out this event!',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };

    try {
      if ((navigator as any).share && (navigator as any).canShare?.(shareData)) {
        await (navigator as any).share(shareData);
        showSuccess('Event shared successfully!', 'Shared');
        return;
      }
    } catch (e) {
      // fall back to clipboard
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      showSuccess('Link copied to clipboard!', 'Shared');
    } catch {
      showError('Unable to share automatically. Copy the URL manually.', 'Share');
    }
  };

  // ---------- Address / Map ----------
  const addressSegments = [
    event.location.address,
    [event.location.city, event.location.state].filter(Boolean).join(', '),
    event.location.postalCode,
    event.location.country
  ].filter(Boolean);
  const formattedAddress = addressSegments.join(', ');
  const placeLabel = event.location.venueDetails || 'Venue';

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [placeLabel, formattedAddress].filter(Boolean).join(', ')
  )}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    [placeLabel, formattedAddress].filter(Boolean).join(', ')
  )}`;

  const mapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapsEmbedSrc = mapsEmbedKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsEmbedKey}&q=${encodeURIComponent(
        [placeLabel, formattedAddress].filter(Boolean).join(', ')
      )}`
    : null;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        [placeLabel, formattedAddress].filter(Boolean).join(', ')
      );
      showSuccess('Address copied to clipboard!', 'Copied');
    } catch {
      showError('Unable to copy address.', 'Copy failed');
    }
  };

  // ---------- Image / Dates ----------
  const primaryImage =
    event.images?.find((img) => img.isPrimary) || event.images?.[0];
  const imageUrl = primaryImage?.url || '/placeholder-event.jpg';

  const startDate = formatDate(event.startDate);
  const endDate = event.endDate ? formatDate(event.endDate) : null;

  // ---------- UI ----------
  return (
    <>
      <main>
        {/* NOTE: Keeping header off this component as before */}

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 
            ✅ NEW: Mobile-first layout fix
            - Mobile: stack vertically with flex-col
            - Desktop (md+): switch to original 3-column grid
          */}
          <div className="flex flex-col gap-8 md:grid md:grid-cols-[400px_1fr_260px] items-start">
            {/* MOBILE: Top poster (non-sticky, optimized) */}
            <div
              className="md:hidden rounded-lg overflow-hidden relative bg-muted"
              onClick={() => setShowImageModal(true)}
            >
              <Image
                src={imageUrl}
                alt={event.title}
                width={1200}
                height={1600}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* LEFT: Sticky portrait image (DESKTOP ONLY) */}
            <div className="hidden md:block sticky top-[120px] z-30 self-start">
              <div
                className="h-[600px] w-full rounded-lg overflow-hidden relative group cursor-pointer bg-muted"
                onClick={() => setShowImageModal(true)}
              >
                <Image
                  src={imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 pointer-events-none flex items-end justify-end p-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white px-2 py-1 rounded flex items-center gap-1">
                    <ZoomIn className="h-4 w-4" />
                    <span className="text-xs">Click to zoom</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE: All event details */}
            <div className="space-y-8">
              {/* Title + categories + Save/Share */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold break-words">{event.title}</h1>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleSaveEvent}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border',
                      isSaved
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'border-muted-foreground/20 hover:bg-muted'
                    )}
                    aria-label={isSaved ? 'Saved' : 'Save'}
                    title={isSaved ? 'Saved' : 'Save'}
                  >
                    <Heart
                      className={cn('h-4 w-4', isSaved && 'fill-primary')}
                    />
                  </button>

                  <button
                    onClick={handleShareEvent}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-muted-foreground/20 hover:bg-muted"
                    aria-label="Share"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* About */}
              <section>
                <h2 className="text-xl font-semibold mb-3">About this event</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">
                    <LinkifiedText>{event.description}</LinkifiedText>
                  </p>
                </div>
              </section>

              {/* Date and Time */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Date and Time</h3>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{startDate}</p>
                    {endDate && (
                      <p className="text-muted-foreground">to {endDate}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Location</h3>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="w-full">
                    <p className="font-medium">{placeLabel}</p>
                    {formattedAddress && (
                      <p className="text-sm">{formattedAddress}</p>
                    )}

                    {mapsEmbedSrc && (
                      <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          title="Event Location Map"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={mapsEmbedSrc}
                        />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Google Maps
                      </a>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Get Directions
                      </a>

                      <button
                        onClick={handleCopyAddress}
                        className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy address
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact / Organizer */}
              {event.contactInfo && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">
                    Contact Information
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    {event.contactInfo.name && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{event.contactInfo.name}</span>
                      </div>
                    )}
                    {event.contactInfo.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${event.contactInfo.email}`}
                          className="text-primary hover:underline"
                        >
                          {event.contactInfo.email}
                        </a>
                      </div>
                    )}
                    {event.contactInfo.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${event.contactInfo.phone}`}
                          className="text-primary hover:underline"
                        >
                          {event.contactInfo.phone}
                        </a>
                      </div>
                    )}
                    {event.contactInfo.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={event.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {event.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* MOBILE: Action panel (register/reminders/views) mirrors right column */}
              <div className="md:hidden">
                <div className="bg-muted p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">Event Details</h3>

                  {/* Price */}
                  {event.price && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Price
                      </h4>
                      {event.price.freeEntry ? (
                        <p className="font-semibold text-green-600">Free Entry</p>
                      ) : (
                        <p className="font-semibold">
                          {event.price.amount} {event.price.currency}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Registration stats */}
                  {event.registrationConfig?.enabled && registrationStats && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Registration
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Registered:</span>
                          <span className="font-medium">
                            {registrationStats.approved}
                            {event.registrationConfig.maxRegistrations &&
                              ` / ${event.registrationConfig.maxRegistrations}`}
                          </span>
                        </div>
                        {registrationStats.pending > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Pending approval:</span>
                            <span>{registrationStats.pending}</span>
                          </div>
                        )}
                        {registrationStats.waitlisted > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Waitlisted:</span>
                            <span>{registrationStats.waitlisted}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Register button / ticket */}
                  {event.registrationConfig?.enabled ? (
                    isUserRegistered ? (
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Registered
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          You're registered for this event
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRegistrationForm(true)}
                        className="block w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md text-center hover:bg-primary/90 mb-4"
                      >
                        Register for Event
                      </button>
                    )
                  ) : (
                    event.price?.ticketUrl && (
                      <a
                        href={event.price.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md text-center hover:bg-primary/90 mb-4"
                      >
                        Get Tickets
                      </a>
                    )
                  )}

                  {/* Reminders */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Set a Reminder
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleAddToCalendar}
                        className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-sm font-medium bg-muted/80 hover:bg-muted border border-muted-foreground/10 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        Add to Calendar
                      </button>
                      <button
                        onClick={handleEmailReminder}
                        className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-sm font-medium bg-muted/80 hover:bg-muted border border-muted-foreground/10 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        Email Reminder
                      </button>
                    </div>
                  </div>

                  {/* Views */}
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Views
                    </h4>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {event.viewCount || 0} views
                      </span>
                    </div>
                  </div>

                  {/* Capacity note */}
                  {event.maxAttendees && (
                    <p className="text-sm text-center text-muted-foreground mt-3">
                      Limited capacity: {event.maxAttendees} attendees max
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* RIGHT: Sticky register / price / stats / reminders (DESKTOP ONLY) */}
            <div className="hidden md:block sticky top-[120px] z-30 self-start">
              <div className="bg-muted p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>

                {/* Price */}
                {event.price && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Price
                    </h4>
                    {event.price.freeEntry ? (
                      <p className="font-semibold text-green-600">Free Entry</p>
                    ) : (
                      <p className="font-semibold">
                        {event.price.amount} {event.price.currency}
                      </p>
                    )}
                  </div>
                )}

                {/* Registration stats */}
                {event.registrationConfig?.enabled && registrationStats && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Registration
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Registered:</span>
                        <span className="font-medium">
                          {registrationStats.approved}
                          {event.registrationConfig.maxRegistrations &&
                            ` / ${event.registrationConfig.maxRegistrations}`}
                        </span>
                      </div>
                      {registrationStats.pending > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Pending approval:</span>
                          <span>{registrationStats.pending}</span>
                        </div>
                      )}
                      {registrationStats.waitlisted > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Waitlisted:</span>
                          <span>{registrationStats.waitlisted}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Register button / ticket */}
                {event.registrationConfig?.enabled ? (
                  isUserRegistered ? (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                      <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Registered
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        You're registered for this event
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className="block w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md text-center hover:bg-primary/90 mb-4"
                    >
                      Register for Event
                    </button>
                  )
                ) : (
                  event.price?.ticketUrl && (
                    <a
                      href={event.price.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-primary text-primary-foreground font-medium py-2 px-4 rounded-md text-center hover:bg-primary/90 mb-4"
                    >
                      Get Tickets
                    </a>
                  )
                )}

                {/* Reminders */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Set a Reminder
                  </h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleAddToCalendar}
                      className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-sm font-medium bg-muted/80 hover:bg-muted border border-muted-foreground/10 transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Add to Calendar
                    </button>
                    <button
                      onClick={handleEmailReminder}
                      className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-sm font-medium bg-muted/80 hover:bg-muted border border-muted-foreground/10 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Email Reminder
                    </button>
                  </div>
                </div>

                {/* Views */}
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Views
                  </h4>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {event.viewCount || 0} views
                    </span>
                  </div>
                </div>

                {/* Capacity note */}
                {event.maxAttendees && (
                  <p className="text-sm text-center text-muted-foreground mt-3">
                    Limited capacity: {event.maxAttendees} attendees max
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notifications & Confirmation Dialog */}
      <NotificationContainer
        notifications={notifications}
        onDismiss={removeNotification}
        position="top-right"
      />
      {dialog}

      {/* Reminder Selection Dialog */}
      {showReminderDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Set Email Reminder</h2>
              <button
                onClick={() => setShowReminderDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              When would you like to be reminded about this event?
            </p>

            <div className="space-y-3">
              {[
                { label: '1 hour before', hours: 1 },
                { label: '1 day before', hours: 24 },
                { label: '3 days before', hours: 72 },
                { label: '1 week before', hours: 168 }
              ].map((option) => (
                <button
                  key={option.hours}
                  onClick={() => handleSetReminder(option.hours, option.label)}
                  className="w-full text-left p-3 rounded-md border border-muted-foreground/20 hover:bg-muted transition-colors"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-muted-foreground/20">
              <button
                onClick={() => setShowReminderDialog(false)}
                className="w-full py-2 px-4 rounded-md text-sm font-medium border border-muted-foreground/20 hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationForm && event && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Event Registration</h2>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <EventRegistrationForm
                event={event}
                onRegistrationComplete={() => {
                  setIsUserRegistered(true);
                  setShowRegistrationForm(false);
                  showSuccess('Registration successful!', 'Welcome aboard!');
                  if (event.registrationConfig?.enabled && user?.uid) {
                    RegistrationRepository.getRegistrationStats(
                      eventId
                    ).then(setRegistrationStats);
                  }
                }}
                onClose={() => setShowRegistrationForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={event.title}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
