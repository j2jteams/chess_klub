'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/lib/models';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerEventProps {
  events: Event[];
}

export default function BannerEvent({ events }: BannerEventProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === events.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];
  const primaryImage = currentEvent.images?.find(img => img.isPrimary)?.url || 
                      currentEvent.images?.[0]?.url || 
                      '/placeholder-event.jpg';

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? events.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === events.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <section className="mb-8">
      <div className="relative">
        <Link href={`/events/${currentEvent.id}`} className="block">
          <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-xl overflow-hidden shadow-lg group cursor-pointer">
            <Image
              src={primaryImage}
              alt={currentEvent.title}
              fill
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              sizes="100vw"
              key={currentEvent.id} // Force re-render when event changes
            />
          </div>
        </Link>

        {/* Navigation arrows - only show if multiple events */}
        {events.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Next event"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots indicator - only show if multiple events */}
        {events.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to event ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}