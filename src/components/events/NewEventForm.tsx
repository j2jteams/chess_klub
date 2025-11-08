'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Image, Eye } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { eventFormSchema, EventFormValues, defaultEventFormValues } from '@/lib/schemas/event-schema';
import { uploadEventImages } from '@/lib/firebase/storage';
import { UserRepository } from '@/lib/firebase/repositories';
import EventPreview from './EventPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface NewEventFormProps {
  onSubmit: (data: EventFormValues) => void;
  isSubmitting: boolean;
  showError?: (message: string, title?: string) => void;
  showWarning?: (message: string, title?: string) => void;
  initialValues?: EventFormValues;
  editMode?: boolean;
}

import RegistrationFormBuilder from './RegistrationFormBuilder';
import { RegistrationConfig } from '@/lib/models/registration';
import { User, UserRole } from '@/lib/models';
import { defaultRegistrationConfig } from '@/lib/schemas/registration-schema';

export default function NewEventForm({ onSubmit, isSubmitting, showError, showWarning, initialValues, editMode = false }: NewEventFormProps) {
  const { user } = useAuth();
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationConfig>(
    (initialValues?.registrationConfig as RegistrationConfig) || defaultRegistrationConfig
  );
  const [userData, setUserData] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form initialization with default values or initial values for editing
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: initialValues || {
      ...defaultEventFormValues,
      organizerId: user?.uid || '',
      published: false,
    },
  });

  // Initialize state from initial values when in edit mode
  useEffect(() => {
    if (editMode && initialValues) {
      // Initialize showPriceFields based on whether price info exists
      if (initialValues.price && (initialValues.price.amount || initialValues.price.ticketUrl)) {
        setShowPriceFields(true);
      }
      
      // Initialize uploadedImageUrls from existing images
      if (initialValues.images && initialValues.images.length > 0) {
        const imageUrls = initialValues.images.map(img => img.url);
        setUploadedImageUrls(imageUrls);
      }
    }
  }, [editMode, initialValues]);

  // Fetch user data and check admin status
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userData = await UserRepository.getUserById(user.uid);
          if (userData) {
            setUserData(userData);
            setIsAdmin(userData.role === UserRole.ADMIN);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // File validation
  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload only JPG, PNG, or GIF images.');
      return false;
    }
    
    if (file.size > maxSize) {
      setFileError('File too large. Maximum size is 10MB.');
      return false;
    }
    
    setFileError(null);
    return true;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList, append: boolean = false) => {
    const newFiles: File[] = [];
    
    // Convert FileList to array and validate each file
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        newFiles.push(file);
      }
    });
    
    if (newFiles.length > 0) {
      setSelectedFiles(prev => (append ? [...prev, ...newFiles] : newFiles));
    }
  }, []);

  // Handle removing a file
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // If file was already uploaded, remove from uploaded URLs
    if (uploadedImageUrls[index]) {
      setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    }
    
    // Remove progress if it exists
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  }, [uploadedImageUrls]);

  // Upload files to Firebase Storage
  const uploadFiles = useCallback(async (): Promise<string[]> => {
    if (selectedFiles.length === 0 || !user?.uid) return [];
    
    setIsUploading(true);
    
    try {
      const urls = await uploadEventImages(
        selectedFiles,
        user.uid,
        (index, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [index]: progress.progress
          }));
        }
      );
      
      setUploadedImageUrls(urls);
      return urls;
    } catch (error) {
      console.error('Error uploading files:', error);
      setFileError('Failed to upload images. Please try again.');
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, user?.uid]);

  // State for preview mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<EventFormValues | null>(null);

  // Form submission handler
  const handleSubmit = async (data: EventFormValues) => {
    // Prepare data for submission
    data.organizerId = user?.uid || '';
    
    // Add registration configuration
    data.registrationConfig = registrationConfig as any;
    
    // If free entry, set amount to 0
    if (data.price?.freeEntry) {
      data.price.amount = 0;
    }
    
    // Remove categories (no longer used)
    delete data.categories;
    
    // Show preview before submitting
    setPreviewData(data);
    setShowPreview(true);
  };
  
  // Final submission after preview
  const handleFinalSubmit = async () => {
    if (!previewData) return;
    
    // Make a copy of the data
    const data = { ...previewData };
    
    // Combine existing uploaded images with newly uploaded ones
    let allImageUrls: string[] = [...uploadedImageUrls];
    
    // Upload new images if any selected
    if (selectedFiles.length > 0) {
      const newImageUrls = await uploadFiles();
      allImageUrls = [...allImageUrls, ...newImageUrls];
    }
    
    // Map all image URLs to EventImage objects
    if (allImageUrls.length > 0) {
      data.images = allImageUrls.map((url, index) => ({
        url,
        isPrimary: index === 0, // First image is primary
        alt: `${data.title} - Image ${index + 1}`
      }));
      
      // The flyer URL will be handled in the parent component since it's not part of the form schema
    }
    
    // Pass to parent component
    onSubmit(data);
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    // Format as YYYY-MM-DDThh:mm
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  
  // Current date and time in local time zone, formatted for datetime-local input
  const now = new Date();
  const localDatetime = formatDateForInput(now);

  return (
    <>
      {showPreview && previewData && (
        <EventPreview 
          formData={previewData} 
          onClose={() => setShowPreview(false)} 
          onSubmit={handleFinalSubmit} 
        />
      )}
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit triggered');
            form.handleSubmit(handleSubmit)(e);
          }} 
          className="space-y-8"
        >
        {/* Basic Information Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>🎉 What's your awesome event called?</FormLabel>
                <FormControl>
                  <Input placeholder="Give your event an amazing name!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>✨ Tell us what makes this event special!</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share the excitement! What can people expect? What makes it unique?" 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🚀 When does the fun begin?</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      min={localDatetime}
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        
                        // Also update end date if it exists and is now before start date
                        const newStartDate = e.target.value;
                        const endDate = form.watch('endDate');
                        
                        if (newStartDate && endDate && new Date(endDate) < new Date(newStartDate)) {
                          // Set end date to be start date + 1 hour
                          const newEndDate = new Date(newStartDate);
                          newEndDate.setHours(newEndDate.getHours() + 1);
                          
                          setTimeout(() => {
                            form.setValue('endDate', formatDateForInput(newEndDate));
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🎬 When does the party wrap up? (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      min={form.watch('startDate') || localDatetime}
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        
                        // If end date is before start date, update it
                        const startDate = form.watch('startDate');
                        const endDate = e.target.value;
                        
                        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
                          // Set end date to be same as start date but 1 hour later
                          const newEndDate = new Date(startDate);
                          newEndDate.setHours(newEndDate.getHours() + 1);
                          
                          setTimeout(() => {
                            field.onChange(formatDateForInput(newEndDate));
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Location Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Location (Optional)</h2>
          
          <FormField
            control={form.control}
            name="location.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>📍 Where's the magic happening? (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Street address, building name, room number..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🏙️ Which city gets to host this?</FormLabel>
                  <FormControl>
                    <Input placeholder="The awesome city where it's happening!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🗺️ State/Province (if you want to share)</FormLabel>
                  <FormControl>
                    <Input placeholder="State/Province" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>🌍 Country</FormLabel>
                  <FormControl>
                    <Input placeholder="The amazing country hosting this event!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>📮 Postal Code (if you'd like)</FormLabel>
                  <FormControl>
                    <Input placeholder="ZIP or postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="location.venueDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>🏢 Any special venue details to share?</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Floor 3, Conference Room A, near the coffee shop..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Pricing Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pricing (Optional)</h2>
            <button
              type="button"
              onClick={() => setShowPriceFields(!showPriceFields)}
              className="text-sm text-primary hover:underline"
            >
              {showPriceFields ? 'Hide price details' : 'Add price details'}
            </button>
          </div>
          
          <FormField
            control={form.control}
            name="price.freeEntry"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Free Entry</FormLabel>
                  <FormDescription>
                    Check this if your event is free to attend
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {showPriceFields && !form.watch('price.freeEntry') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="AUD">AUD (A$)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {showPriceFields && (
            <FormField
              control={form.control}
              name="price.ticketUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Link to where attendees can purchase tickets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        {/* Contact Information Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Contact Information (Optional)</h2>
          
          <FormField
            control={form.control}
            name="contactInfo.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name</FormLabel>
                <FormControl>
                  <Input placeholder="Contact person name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="contact@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="contactInfo.website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Image Upload Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Event Images</h2>
          <p className="text-sm text-muted-foreground">
            Add images for your event. The first image will be used as the primary image.
          </p>
          
          <div 
            className="border-2 border-dashed border-muted rounded-lg p-6 text-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelect(e.dataTransfer.files);
              }
            }}
          >
            {selectedFiles.length === 0 && uploadedImageUrls.length === 0 ? (
              <>
                <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop images or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                   Add images for your event. The first image will be used as the primary image.
                   <br />
                   <span className="text-xs">
                     Minimum dimensions: 200 × 200<br />
                     Recommended dimensions: 1200 × 630<br />
                     Recommended file size: less than 500 KB<br />
                     Image format: JPEG
                   </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
                    <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                    Add Image
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileSelect(e.target.files);
                      }
                    }}
                  />
                </label>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Display existing uploaded images */}
                  {uploadedImageUrls.map((url, index) => (
                    <div key={`uploaded-${index}`} className="relative">
                      <div className="aspect-square rounded-md overflow-hidden border border-muted">
                        <img
                          src={url}
                          alt={`Event image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* Display newly selected files */}
                  {selectedFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative">
                      <div className="aspect-square rounded-md overflow-hidden border border-muted">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {uploadedImageUrls.length === 0 && index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                      {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
                          <span className="absolute text-white font-bold">
                            {Math.round(uploadProgress[index])}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <label htmlFor="file-upload-more" className="cursor-pointer">
                  <span className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
                    <Plus className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                    Add More Images
                  </span>
                  <input
                    id="file-upload-more"
                    name="file-upload-more"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/gif"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileSelect(e.target.files, true);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
          {fileError && (
            <p className="text-sm text-destructive">
              {fileError}
            </p>
          )}
        </div>
        
        {/* Publication Settings Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Publication Settings</h2>
          
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Publish immediately</FormLabel>
                  <FormDescription>
                    Make this event visible to the public immediately after submission
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          {/* Admin Banner Settings - Only visible to admin users */}
          {isAdmin && (
            <FormField
              control={form.control}
              name="isFeaturedBanner"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-orange-600 font-semibold">
                      Feature as Main Banner
                    </FormLabel>
                    <FormDescription>
                      Display this event as a prominent banner at the top of the dashboard page (Admin Only)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="maxAttendees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Attendees (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="Leave blank for unlimited"
                    {...field}
                    onChange={e => field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )} 
                  />
                </FormControl>
                <FormDescription>
                  Set a limit for the number of attendees
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Registration Configuration Section */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Registration Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure registration for your event. Users can register with custom fields you define.
          </p>
          
          <RegistrationFormBuilder
            initialConfig={registrationConfig}
            onChange={(config) => {
              console.log('📥 NewEventForm: Received config from RegistrationFormBuilder:', config);
              setRegistrationConfig(config);
              form.setValue('registrationConfig', config as any);
              console.log('✅ NewEventForm: Updated form value and state');
            }}
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            disabled={isSubmitting || isUploading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              // Trigger validation on all fields
              const isValid = await form.trigger();
              console.log('Form validation result:', isValid);
              
              if (isValid) {
                // Get current form values
                const data = form.getValues();
                console.log('Form values for preview:', data);
                
                // Prepare data for preview
                data.organizerId = user?.uid || '';
                data.registrationConfig = registrationConfig as any;
                
                // If free entry, set amount to 0
                if (data.price?.freeEntry) {
                  data.price.amount = 0;
                }
                
                // Show preview
                setPreviewData(data);
                setShowPreview(true);
              } else {
                // Show validation errors
                showError?.('Please fill in all required fields correctly', 'Validation Error');
              }
            }}
            disabled={isSubmitting || isUploading || form.formState.isSubmitting}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button 
            type="button" 
            disabled={isSubmitting || isUploading}
            onClick={async () => {
              console.log('Manual submit button clicked');
              
              // Manually trigger validation and submission
              const isValid = await form.trigger();
              console.log('Form validation result:', isValid);
              
              if (isValid) {
                // Get current form values
                const data = form.getValues();
                console.log('Form values for submission:', data);
                
                // Use the same logic as the form submit handler
                data.organizerId = user?.uid || '';
                data.registrationConfig = registrationConfig as any;
                
                if (data.price?.freeEntry) {
                  data.price.amount = 0;
                }
                
                // Combine existing uploaded images with newly uploaded ones
                let allImageUrls: string[] = [...uploadedImageUrls];
                
                // Upload new images if any selected
                if (selectedFiles.length > 0) {
                  const newImageUrls = await uploadFiles();
                  allImageUrls = [...allImageUrls, ...newImageUrls];
                }
                
                // Map all image URLs to EventImage objects
                if (allImageUrls.length > 0) {
                  data.images = allImageUrls.map((url, index) => ({
                    url,
                    isPrimary: index === 0, // First image is primary
                    alt: `${data.title} - Image ${index + 1}`
                  }));
                  
                  // The flyer URL will be handled in the parent component since it's not part of the form schema
                }
                
                // Pass to parent component
                onSubmit(data);
              } else {
                // Show validation errors
                showError?.('Please fill in all required fields correctly', 'Validation Error');
              }
            }}
          >
            {isUploading 
              ? 'Uploading Images...' 
              : isSubmitting 
                ? 'Submitting...' 
                : editMode 
                  ? 'Update Event' 
                  : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}