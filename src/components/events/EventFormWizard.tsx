'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Image, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { eventFormSchema, EventFormValues, defaultEventFormValues } from '@/lib/schemas/event-schema';
import { uploadEventImages } from '@/lib/firebase/storage';
import { UserRepository } from '@/lib/firebase/repositories';
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
import SimpleRegistrationBuilder from './SimpleRegistrationBuilder';
import { RegistrationConfig } from '@/lib/models/registration';
import { User, UserRole } from '@/lib/models';
import { defaultRegistrationConfig } from '@/lib/schemas/registration-schema';
import EventLivePreview from './EventLivePreview';

interface EventFormWizardProps {
  onSubmit: (data: EventFormValues) => void;
  isSubmitting: boolean;
  showError?: (message: string, title?: string) => void;
  showWarning?: (message: string, title?: string) => void;
  initialValues?: EventFormValues;
  editMode?: boolean;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: '📝' },
  { id: 2, title: 'Location', icon: '📍' },
  { id: 3, title: 'Pricing & Contact', icon: '💰' },
  { id: 4, title: 'Images', icon: '🖼️' },
  { id: 5, title: 'Settings', icon: '⚙️' },
];

export default function EventFormWizard({ 
  onSubmit, 
  isSubmitting, 
  showError, 
  showWarning, 
  initialValues, 
  editMode = false 
}: EventFormWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
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

  // Form initialization - ensure all string fields are empty strings, not undefined
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: initialValues || {
      ...defaultEventFormValues,
      organizerId: user?.uid || '',
      published: false,
      // Ensure all optional string fields are empty strings
      endDate: defaultEventFormValues.endDate || '',
      location: {
        address: defaultEventFormValues.location.address || '',
        city: defaultEventFormValues.location.city || '',
        state: defaultEventFormValues.location.state || '',
        country: defaultEventFormValues.location.country || '',
        postalCode: defaultEventFormValues.location.postalCode || '',
        venueDetails: defaultEventFormValues.location.venueDetails || '',
      },
      price: {
        freeEntry: defaultEventFormValues.price?.freeEntry || false,
        amount: defaultEventFormValues.price?.amount || 0,
        currency: defaultEventFormValues.price?.currency || 'USD',
        ticketUrl: defaultEventFormValues.price?.ticketUrl || '',
      },
      contactInfo: {
        name: defaultEventFormValues.contactInfo?.name || '',
        email: defaultEventFormValues.contactInfo?.email || '',
        phone: defaultEventFormValues.contactInfo?.phone || '',
        website: defaultEventFormValues.contactInfo?.website || '',
      },
    },
    mode: 'onChange', // Validate on change for live preview
  });

  // Watch form values for live preview
  const formValues = form.watch();

  // Initialize state from initial values when in edit mode
  useEffect(() => {
    if (editMode && initialValues) {
      if (initialValues.price && (initialValues.price.amount || initialValues.price.ticketUrl)) {
        setShowPriceFields(true);
      }
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
    if (uploadedImageUrls[index]) {
      setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
    }
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

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  
  const now = new Date();
  const localDatetime = formatDateForInput(now);

  // Navigation functions
  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof EventFormValues | string)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description', 'startDate'];
        break;
      case 2:
        fieldsToValidate = ['location.city'];
        break;
      case 3:
        fieldsToValidate = [];
        break;
      case 4:
        fieldsToValidate = [];
        break;
      case 5:
        fieldsToValidate = [];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showError?.('Please fill in all required fields correctly', 'Validation Error');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submission
  const handleFinalSubmit = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      showError?.('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    const data = form.getValues();
    data.organizerId = user?.uid || '';
    data.registrationConfig = registrationConfig as any;
    
    if (data.price?.freeEntry) {
      data.price.amount = 0;
    }
    
    delete data.categories;
    
    // Upload images if any selected
    let allImageUrls: string[] = [...uploadedImageUrls];
    
    if (selectedFiles.length > 0) {
      const newImageUrls = await uploadFiles();
      allImageUrls = [...allImageUrls, ...newImageUrls];
    }
    
    if (allImageUrls.length > 0) {
      data.images = allImageUrls.map((url, index) => ({
        url,
        isPrimary: index === 0,
        alt: `${data.title} - Image ${index + 1}`
      }));
    }
    
    onSubmit(data);
  };

  // Prepare preview data
  const previewData: EventFormValues = {
    ...formValues,
    images: [
      ...uploadedImageUrls.map((url, index) => ({
        url,
        isPrimary: index === 0,
        alt: `${formValues.title || 'Event'} - Image ${index + 1}`
      })),
      ...selectedFiles.map((file, index) => ({
        url: URL.createObjectURL(file),
        isPrimary: uploadedImageUrls.length === 0 && index === 0,
        alt: `${formValues.title || 'Event'} - New Image ${index + 1}`
      }))
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Left Side - Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          currentStep > step.id
                            ? 'bg-primary border-primary text-primary-foreground'
                            : currentStep === step.id
                            ? 'bg-primary border-primary text-primary-foreground scale-110'
                            : 'bg-background border-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <span className="text-xl">{step.icon}</span>
                        )}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${
                        currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                      <p className="text-muted-foreground">Tell us about your chess event</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Charlotte Chess Championship 2025" 
                              {...field} 
                              value={field.value || ''}
                            />
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
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your chess tournament, event details, format, time controls..." 
                              className="min-h-[150px]" 
                              {...field} 
                              value={field.value || ''}
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
                            <FormLabel>Start Date & Time *</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                min={localDatetime}
                                {...field} 
                                value={field.value || ''}
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
                            <FormLabel>End Date & Time (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                min={form.watch('startDate') || localDatetime}
                                {...field} 
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Location</h2>
                      <p className="text-muted-foreground">Where will your chess event take place?</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="location.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} value={field.value || ''} />
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
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Charlotte" {...field} value={field.value || ''} />
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
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input placeholder="NC" {...field} value={field.value || ''} />
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
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} value={field.value || ''} />
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
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="28201" {...field} value={field.value || ''} />
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
                          <FormLabel>Venue Details</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Conference Room A, Floor 3" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Pricing & Contact */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Pricing & Contact</h2>
                      <p className="text-muted-foreground">Set pricing and contact information</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Pricing</h3>
                        <button
                          type="button"
                          onClick={() => setShowPriceFields(!showPriceFields)}
                          className="text-sm text-primary hover:underline"
                        >
                          {showPriceFields ? 'Hide' : 'Add price'}
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
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} 
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
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                <Input placeholder="https://..." {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <h3 className="font-semibold">Contact Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="contactInfo.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact person name" {...field} value={field.value || ''} />
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
                                  value={field.value || ''}
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
                                <Input placeholder="Phone number" {...field} value={field.value || ''} />
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
                              <Input placeholder="https://..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Images */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Event Images</h2>
                      <p className="text-muted-foreground">Add images for your chess event</p>
                    </div>
                    
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
                            <p className="text-sm text-muted-foreground mb-2">
                              Drag and drop images or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF up to 10MB. First image will be primary.
                            </p>
                          </div>
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
                              <Plus className="-ml-0.5 h-4 w-4" />
                              Add Image
                            </span>
                            <input
                              id="file-upload"
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
                              </div>
                            ))}
                          </div>
                          <label htmlFor="file-upload-more" className="cursor-pointer">
                            <span className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
                              <Plus className="-ml-0.5 h-4 w-4" />
                              Add More Images
                            </span>
                            <input
                              id="file-upload-more"
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
                      <p className="text-sm text-destructive">{fileError}</p>
                    )}
                  </div>
                )}

                {/* Step 5: Settings */}
                {currentStep === 5 && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Settings & Registration</h2>
                      <p className="text-muted-foreground">Configure registration and publication settings</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <h3 className="font-semibold">Publication Settings</h3>
                      
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
                                Make this event visible to the public immediately
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
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
                                <FormLabel className="text-primary font-semibold">
                                  Feature as Main Banner
                                </FormLabel>
                                <FormDescription>
                                  Display as prominent banner (Admin Only)
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
                                value={field.value ?? ''}
                                onChange={e => field.onChange(
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <h3 className="font-semibold">Registration Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure registration fields for your event
                      </p>
                      
                      <SimpleRegistrationBuilder
                        initialConfig={registrationConfig}
                        onChange={(config: RegistrationConfig) => {
                          setRegistrationConfig(config);
                          form.setValue('registrationConfig', config as any);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting || isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading 
                        ? 'Uploading Images...' 
                        : isSubmitting 
                          ? 'Creating Event...' 
                          : editMode 
                            ? 'Update Event' 
                            : 'Create Event'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="w-[500px] border-l border-primary/10 bg-muted/20 overflow-y-auto">
          <div className="sticky top-0 bg-background border-b border-primary/10 p-4 z-10">
            <h3 className="font-bold text-lg">Live Preview</h3>
            <p className="text-xs text-muted-foreground">See how your event will look</p>
          </div>
          <div className="p-6">
            <EventLivePreview formData={previewData} />
          </div>
        </div>
      </div>
    </div>
  );
}

