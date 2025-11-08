'use client';

import { useState } from 'react';
import { EventFormValues } from '@/lib/schemas/event-schema';
import { Button } from '@/components/ui/button';
import { LinkifiedText } from '@/components/ui/linkified-text';
import { X, Calendar, MapPin, Tag, DollarSign, Info } from 'lucide-react';

interface EventPreviewProps {
  formData: EventFormValues;
  onClose: () => void;
  onSubmit: () => void;
}

export default function EventPreview({ formData, onClose, onSubmit }: EventPreviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get placeholder image if no files selected
  const getDisplayImage = () => {
    // If we have a data URL from the uploaded file
    if (formData.images && formData.images.length > 0 && formData.images[0].url) {
      return formData.images[0].url;
    }
    
    // Return placeholder image
    return '/placeholder-event.jpg';
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border shadow-lg rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between bg-card p-4 border-b z-10">
          <h2 className="text-xl font-bold">Event Preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Event Image */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img 
              src={getDisplayImage()} 
              alt={formData.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Event Title */}
          <h1 className="text-2xl font-bold">{formData.title}</h1>
          
          {/* Event Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">{formatDate(formData.startDate)}</p>
                {formData.endDate && (
                  <p className="text-sm text-muted-foreground">
                    to {formatDate(formData.endDate)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {formData.location.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.location.city}, {formData.location.state} {formData.location.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.location.country}
                </p>
              </div>
            </div>
            
            {formData.price && (
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Price</p>
                  {formData.price.freeEntry ? (
                    <p className="text-sm text-muted-foreground">Free Entry</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formData.price.amount} {formData.price.currency}
                    </p>
                  )}
                  {formData.price.ticketUrl && (
                    <a 
                      href={formData.price.ticketUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Get Tickets
                    </a>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <Tag className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Categories</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.categories && formData.categories.length > 0 ? (
                    formData.categories.map((category) => (
                      <span 
                        key={category} 
                        className="px-2 py-1 text-xs bg-muted rounded-full"
                      >
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">About this event</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              <LinkifiedText>{formData.description}</LinkifiedText>
            </p>
          </div>
          
          {/* Contact Info */}
          {formData.contactInfo && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  {formData.contactInfo.name && (
                    <p className="text-sm">
                      <span className="font-medium">Contact:</span> {formData.contactInfo.name}
                    </p>
                  )}
                  {formData.contactInfo.email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {formData.contactInfo.email}
                    </p>
                  )}
                  {formData.contactInfo.phone && (
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {formData.contactInfo.phone}
                    </p>
                  )}
                  {formData.contactInfo.website && (
                    <p className="text-sm">
                      <span className="font-medium">Website:</span>{' '}
                      <a 
                        href={formData.contactInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {formData.contactInfo.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Back to Editing
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Event'}
          </Button>
        </div>
      </div>
    </div>
  );
}