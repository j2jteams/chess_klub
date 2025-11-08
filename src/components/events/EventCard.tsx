'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Event } from '@/lib/models';
import { HeartIcon, CalendarIcon, MapPinIcon, EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Find primary image or use first image
  const primaryImage = event.images?.find(img => img.isPrimary) || event.images?.[0];
  const imageUrl = primaryImage?.url || '/placeholder-event.jpg';

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    // Here we would call the save/unsave function from a hook
  };

  return (
    <Link 
      href={`/events/${event.id}`} 
      className={cn(
        "block bg-background border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md",
        featured && "md:col-span-2 md:flex md:h-64"
      )}
    >
      <div 
        className={cn(
          "relative h-64 bg-muted overflow-hidden",
          featured && "md:h-64 md:w-1/2"
        )}
      >
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover object-top"
        />
        <button 
          onClick={toggleSave} 
          aria-label={isSaved ? "Unsave event" : "Save event"}
          className="absolute top-3 right-3 p-1.5 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
        >
          <HeartIcon 
            className={cn(
              "h-5 w-5 transition-colors", 
              isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )} 
          />
        </button>
      </div>
      
      <div className={cn(
        "p-4",
        featured && "md:w-1/2 md:p-6"
      )}>
        <h3 className={cn(
          "font-semibold line-clamp-2 mb-2",
          featured ? "text-xl" : "text-lg"
        )}>
          {event.title}
        </h3>
        
        <p className={cn(
          "text-sm text-muted-foreground mb-3 line-clamp-2",
          featured && "line-clamp-3"
        )}>
          {event.description}
        </p>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
          <span>{formatDate(event.startDate)}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <MapPinIcon className="h-3.5 w-3.5 mr-1" />
            <span>{event.location.city}, {event.location.state || event.location.country}</span>
          </div>
          <div className="flex items-center">
            <EyeIcon className="h-3.5 w-3.5 mr-1" />
            <span>{event.viewCount || 0}</span>
          </div>
        </div>
        
        {featured && event.price && (
          <div className="mt-4 flex items-center">
            {event.price.freeEntry ? (
              <span className="text-sm font-medium text-green-600">Free</span>
            ) : (
              <span className="text-sm font-medium">{event.price.amount} {event.price.currency}</span>
            )}
          </div>
        )}
        
      </div>
    </Link>
  );
}