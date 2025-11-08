'use client';

import { EventFormValues } from '@/lib/schemas/event-schema';
import { Calendar, MapPin, DollarSign, User, Mail, Phone, Globe } from 'lucide-react';
import { LinkifiedText } from '@/components/ui/linkified-text';

interface EventLivePreviewProps {
  formData: EventFormValues;
}

export default function EventLivePreview({ formData }: EventLivePreviewProps) {
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('default', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get display image
  const getDisplayImage = () => {
    if (formData.images && formData.images.length > 0) {
      const primaryImage = formData.images.find(img => img.isPrimary) || formData.images[0];
      return primaryImage.url;
    }
    return '/placeholder-event.jpg';
  };

  // Format location
  const formatLocation = () => {
    const parts = [
      formData.location?.address,
      formData.location?.city,
      formData.location?.state,
      formData.location?.postalCode,
      formData.location?.country
    ].filter(Boolean);
    
    if (parts.length === 0) return 'Location not specified';
    return parts.join(', ');
  };

  return (
    <div className="bg-card border border-primary/10 rounded-lg shadow-lg overflow-hidden">
      {/* Event Image */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        <img 
          src={getDisplayImage()} 
          alt={formData.title || 'Event preview'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
          }}
        />
      </div>
      
      <div className="p-6 space-y-6">
        {/* Event Title */}
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {formData.title || 'Event Title'}
          </h1>
          {!formData.title && (
            <p className="text-xs text-muted-foreground italic">Enter a title in Step 1</p>
          )}
        </div>
        
        {/* Event Meta */}
        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(formData.startDate)}
              </p>
              {formData.endDate && (
                <p className="text-sm text-muted-foreground">
                  to {formatDate(formData.endDate)}
                </p>
              )}
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Location</p>
              <p className="text-sm text-muted-foreground">
                {formatLocation()}
              </p>
              {formData.location?.venueDetails && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.location.venueDetails}
                </p>
              )}
            </div>
          </div>
          
          {/* Price */}
          {formData.price && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">Price</p>
                {formData.price.freeEntry ? (
                  <p className="text-sm text-muted-foreground">Free Entry</p>
                ) : formData.price.amount ? (
                  <p className="text-sm text-muted-foreground">
                    {formData.price.amount} {formData.price.currency || 'USD'}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not specified</p>
                )}
                {formData.price.ticketUrl && (
                  <a 
                    href={formData.price.ticketUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Get Tickets →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Description */}
        {formData.description && (
          <div className="space-y-2 pt-4 border-t border-primary/10">
            <h2 className="text-lg font-semibold">About this event</h2>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              <LinkifiedText>{formData.description}</LinkifiedText>
            </div>
          </div>
        )}
        
        {/* Contact Info */}
        {formData.contactInfo && (
          (formData.contactInfo.name || 
           formData.contactInfo.email || 
           formData.contactInfo.phone || 
           formData.contactInfo.website) && (
            <div className="space-y-2 pt-4 border-t border-primary/10">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <div className="space-y-2">
                {formData.contactInfo.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.contactInfo.name}</span>
                  </div>
                )}
                {formData.contactInfo.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${formData.contactInfo.email}`}
                      className="text-primary hover:underline"
                    >
                      {formData.contactInfo.email}
                    </a>
                  </div>
                )}
                {formData.contactInfo.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.contactInfo.phone}</span>
                  </div>
                )}
                {formData.contactInfo.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={formData.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {formData.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        
        {/* Registration Info */}
        {formData.registrationConfig && (
          <div className="pt-4 border-t border-primary/10">
            <p className="text-sm font-medium">Registration</p>
            <p className="text-xs text-muted-foreground">
              {formData.registrationConfig.enabled 
                ? 'Registration is enabled' 
                : 'Registration is disabled'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

