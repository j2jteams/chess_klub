'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Copy,
  Settings
} from 'lucide-react';
import {
  RegistrationFieldType,
  RegistrationField,
  RegistrationConfig
} from '@/lib/models/registration';
import {
  registrationConfigSchema,
  RegistrationConfigFormValues,
  defaultRegistrationConfig,
  defaultRegistrationField
} from '@/lib/schemas/registration-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface RegistrationFormBuilderProps {
  initialConfig?: RegistrationConfig;
  onChange: (config: RegistrationConfig) => void;
  onPreview?: (config: RegistrationConfig) => void;
}

const FIELD_TYPE_OPTIONS = [
  { value: RegistrationFieldType.TEXT, label: 'Text Input' },
  { value: RegistrationFieldType.TEXTAREA, label: 'Text Area' },
  { value: RegistrationFieldType.EMAIL, label: 'Email' },
  { value: RegistrationFieldType.PHONE, label: 'Phone Number' },
  { value: RegistrationFieldType.NUMBER, label: 'Number' },
  { value: RegistrationFieldType.DATE, label: 'Date' },
  { value: RegistrationFieldType.SELECT, label: 'Dropdown' },
  { value: RegistrationFieldType.RADIO, label: 'Radio Buttons' },
  { value: RegistrationFieldType.CHECKBOX, label: 'Checkboxes' },
  { value: RegistrationFieldType.URL, label: 'URL' },
  { value: RegistrationFieldType.FILE, label: 'File Upload' },
];

const FieldEditor = ({ 
  field, 
  index, 
  onUpdate, 
  onDelete, 
  onDuplicate
}: {
  field: RegistrationField;
  index: number;
  onUpdate: (index: number, field: RegistrationField) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
}) => {
  // Auto-expand fields that need configuration and keep them expanded while editing
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasBeenConfigured, setHasBeenConfigured] = useState<boolean>(
    !!(field.label !== 'New Field' && field.label !== '' && field.label)
  );

  // Local state to prevent focus loss during typing
  const [localField, setLocalField] = useState(field);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update local state when field prop changes (from external updates)
  useEffect(() => {
    setLocalField(field);
  }, [field.id]); // Only update when field ID changes (new field)
  const handleFieldChange = (key: keyof RegistrationField, value: any) => {
    // Update local state immediately so cursor stays stable
    setLocalField(prev => ({ ...prev, [key]: value }));
  
    // Mark as configured
    if (key === 'label' && value && value.trim() && value !== 'New Field') {
      setHasBeenConfigured(true);
    }
  
    // Clear any existing debounce timer
    if (updateTimeout) clearTimeout(updateTimeout);
  
    //  Debounce parent update to avoid rerender spam
    const timeout = setTimeout(() => {
      onUpdate(index, { ...localField, [key]: value }); // Use latest local state
    }, 6000); // Slightly longer for smoother typing experience
  
    setUpdateTimeout(timeout);
  };
  

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [updateTimeout]);

  const handleOptionsChange = (optionsText: string) => {
    const options = optionsText.split('\n').filter(option => option.trim());
    handleFieldChange('options', options);
  };

  const needsOptions = [
    RegistrationFieldType.SELECT,
    RegistrationFieldType.RADIO,
    RegistrationFieldType.CHECKBOX
  ].includes(localField.type);

  return (
    <div className="border rounded-lg p-4 bg-muted/50">
      {/* Field Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <div>
            <h4 className="font-medium">
              {localField.label === 'New Field' || !localField.label ? (
                <span className="text-muted-foreground italic">Click to configure field</span>
              ) : (
                localField.label
              )}
            </h4>
            <p className="text-sm text-muted-foreground">
              {FIELD_TYPE_OPTIONS.find(opt => opt.value === localField.type)?.label}
              {localField.required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasBeenConfigured && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(index)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Field Configuration */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-${index}-label`}>Field Label *</Label>
              <Input
                id={`field-${index}-label`}
                value={localField.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="Enter field label"
              />
            </div>
            
            <div>
              <Label htmlFor={`field-${index}-type`}>Field Type</Label>
              <select
                id={`field-${index}-type`}
                value={localField.type}
                onChange={(e) => handleFieldChange('type', e.target.value as RegistrationFieldType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {FIELD_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor={`field-${index}-placeholder`}>Placeholder Text</Label>
            <Input
              id={`field-${index}-placeholder`}
              value={localField.placeholder || ''}
              onChange={(e) => handleFieldChange('placeholder', e.target.value)}
              placeholder="Enter placeholder text"
            />
          </div>

          <div>
            <Label htmlFor={`field-${index}-description`}>Help Text</Label>
            <Input
              id={`field-${index}-description`}
              value={localField.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Optional help text for users"
            />
          </div>

          {/* Field Options for Select/Radio/Checkbox */}
          {needsOptions && (
            <div>
              <Label htmlFor={`field-${index}-options`}>Options (one per line)</Label>
              <Textarea
                id={`field-${index}-options`}
                value={localField.options?.join('\n') || ''}
                onChange={(e) => handleOptionsChange(e.target.value)}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Validation Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`field-${index}-required`}
                checked={localField.required}
                onChange={(e) => handleFieldChange('required', e.target.checked)}
              />
              <Label htmlFor={`field-${index}-required`}>Required Field</Label>
            </div>

            {[RegistrationFieldType.TEXT, RegistrationFieldType.TEXTAREA].includes(localField.type) && (
              <>
                <div>
                  <Label htmlFor={`field-${index}-minLength`}>Min Length</Label>
                  <Input
                    id={`field-${index}-minLength`}
                    type="number"
                    min="0"
                    value={localField.minLength || ''}
                    onChange={(e) => handleFieldChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor={`field-${index}-maxLength`}>Max Length</Label>
                  <Input
                    id={`field-${index}-maxLength`}
                    type="number"
                    min="1"
                    value={localField.maxLength || ''}
                    onChange={(e) => handleFieldChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </>
            )}

            {localField.type === RegistrationFieldType.NUMBER && (
              <>
                <div>
                  <Label htmlFor={`field-${index}-min`}>Min Value</Label>
                  <Input
                    id={`field-${index}-min`}
                    type="number"
                    value={localField.min || ''}
                    onChange={(e) => handleFieldChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor={`field-${index}-max`}>Max Value</Label>
                  <Input
                    id={`field-${index}-max`}
                    type="number"
                    value={localField.max || ''}
                    onChange={(e) => handleFieldChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </>
            )}

            {localField.type === RegistrationFieldType.FILE && (
              <>
                <div>
                  <Label htmlFor={`field-${index}-fileTypes`}>Accepted File Types</Label>
                  <Input
                    id={`field-${index}-fileTypes`}
                    value={localField.acceptedFileTypes?.join(', ') || ''}
                    onChange={(e) => handleFieldChange('acceptedFileTypes', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder=".pdf, .doc, .jpg"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-${index}-maxFileSize`}>Max File Size (MB)</Label>
                  <Input
                    id={`field-${index}-maxFileSize`}
                    type="number"
                    min="1"
                    value={localField.maxFileSize ? localField.maxFileSize / (1024 * 1024) : ''}
                    onChange={(e) => handleFieldChange('maxFileSize', e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RegistrationFormBuilder({ 
  initialConfig, 
  onChange, 
  onPreview 
}: RegistrationFormBuilderProps) {
  const form = useForm<RegistrationConfigFormValues>({
    resolver: zodResolver(registrationConfigSchema),
    defaultValues: (initialConfig as any) || defaultRegistrationConfig
  });

  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: 'fields'
  });

  const watchedEnabled = form.watch('enabled');

  // Only watch for enabled changes immediately, delay field changes
  useEffect(() => {
    const currentValues = form.getValues();
    onChange(currentValues as RegistrationConfig);
  }, [watchedEnabled]);

  // Debounced update for field changes to prevent input focus loss
// Debounced update for field changes to prevent input focus loss
// Fixed debounced update for field changes
useEffect(() => {
  let debounceTimeout: NodeJS.Timeout | null = null;

  const subscription = form.watch(() => {
    const currentValues = form.getValues();

    // Clear previous timeout before setting a new one
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(() => {
      console.log(' Debounced update triggered:', currentValues);
      onChange(currentValues as RegistrationConfig);
    }, 6000); // Increased delay for smoother typing
  });

  return () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    subscription.unsubscribe();
  };
}, [form, onChange]);



  // Add new field
  const addField = () => {
    const newField = {
      ...defaultRegistrationField,
      id: `field_${Date.now()}`,
      label: 'New Field',
      placeholder: 'Enter your response...',
      order: fields.length
    };
    
    append(newField);
    // Effect will handle parent update
  };

  // Update field
  const updateField = (index: number, field: RegistrationField) => {
    update(index, field);
    // Debounced effect will handle parent update
  };

  // Delete field
  const deleteField = (index: number) => {
    remove(index);
    // Effect will handle parent update
  };

  // Duplicate field
  const duplicateField = (index: number) => {
    const fieldToDuplicate = fields[index];
    const newField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Copy)`,
      order: fields.length
    };
    append(newField);
    // Effect will handle parent update
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-6">
          {/* Registration Settings */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold">Registration Settings</h3>
            
            <FormField
              control={form.control}
              name="enabled"
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
                    <FormLabel>Enable Registration</FormLabel>
                    <FormDescription>
                      Allow users to register for this event with custom form fields
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {watchedEnabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Deadline (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxRegistrations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Registrations (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="Leave blank for unlimited"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="allowWaitlist"
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
                          <FormLabel>Allow Waitlist</FormLabel>
                          <FormDescription>
                            Allow registrations when at capacity
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requireApproval"
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
                          <FormLabel>Require Approval</FormLabel>
                          <FormDescription>
                            Manually approve each registration
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="confirmationMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Thank you for registering! We'll send you more details soon."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Message shown to users after successful registration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* Form Fields */}
          {watchedEnabled && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Registration Form Fields</h3>
                <div className="flex gap-2">
                  {onPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onPreview(form.getValues() as RegistrationConfig)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  )}
                  <Button type="button" onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Note: First name, last name, and email are automatically included as required fields.
              </p>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom fields added yet.</p>
                  <p className="text-sm">Click "Add Field" to create your first custom field.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      onUpdate={updateField}
                      onDelete={deleteField}
                      onDuplicate={duplicateField}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Form>
    </div>
  );
}