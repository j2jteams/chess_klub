import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import EventDetailClient from '@/components/events/EventDetailClient';
import { EventRepository } from '@/lib/firebase/repositories';
import { serializeEvent } from '@/lib/utils/serialize';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Sanitize description for metadata to prevent URL interference
function sanitizeDescriptionForMeta(description: string): string {
  // Remove URLs to prevent interference with metadata parsing
  const urlPattern = /https?:\/\/[^\s]+/gi;
  let sanitized = description.replace(urlPattern, '');
  
  // Remove multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Remove special characters that might interfere with meta tags
  sanitized = sanitized.replace(/[<>"]/g, '');
  
  // Truncate to 160 characters if needed
  if (sanitized.length > 160) {
    sanitized = sanitized.substring(0, 157) + '...';
  }
  
  return sanitized;
}

// Generate dynamic metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const event = await EventRepository.getEventById(id);
    
    if (!event) {
      return {
        title: 'Event Not Found - Chess Klub',
        description: 'The event you are looking for could not be found.',
      };
    }

    // Extract location information
    const location = `${event.location.city}, ${event.location.state || event.location.country}`;
    
    // Format date
    const startDate = typeof event.startDate === 'string' 
      ? new Date(event.startDate)
      : (event.startDate as any)?.toDate?.() || new Date((event.startDate as any)?.seconds * 1000 || Date.now());
    const dateStr = startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Prepare description - sanitize and truncate if too long
    const description = sanitizeDescriptionForMeta(event.description);

    // Get event image URL
    const primaryImage = event.images?.find(img => img.isPrimary) || event.images?.[0];
    let imageUrl = primaryImage?.url || 'https://www.chessklub.com/placeholder-event.jpg';
    // Ensure image URL is absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://www.chessklub.com${imageUrl}`;
    }

    return {
      title: `${event.title} - Chess Klub`,
      description: `${description} | ${dateStr} in ${location}`,
      metadataBase: new URL('https://www.chessklub.com'),
      openGraph: {
        title: event.title,
        description: description,
        type: 'website',
        url: `https://www.chessklub.com/events/${id}`,
        images: [
          {
            url: imageUrl,
            secureUrl: imageUrl,
            width: 1200,
            height: 630,
            alt: event.title,
            type: 'image/jpeg',
          }
        ],
        siteName: 'Chess Klub',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event - Chess Klub',
      description: 'Find and join chess tournaments and events in your community',
    };
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  let event;
  try {
    event = await EventRepository.getEventById(id);
    
    if (!event) {
      notFound();
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header activePage="events" />
      <EventDetailClient event={serializeEvent(event)} eventId={id} />
      <Footer />
    </div>
  );
}