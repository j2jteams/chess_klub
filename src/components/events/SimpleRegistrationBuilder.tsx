'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  RegistrationFieldType,
  RegistrationField,
  RegistrationConfig
} from '@/lib/models/registration';
import {
  defaultRegistrationConfig,
  defaultRegistrationField
} from '@/lib/schemas/registration-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SimpleRegistrationBuilderProps {
  initialConfig?: RegistrationConfig;
  onChange: (config: RegistrationConfig) => void;
}

const FIELD_TYPE_OPTIONS = [
  { value: RegistrationFieldType.TEXT, label: 'Text' },
  { value: RegistrationFieldType.TEXTAREA, label: 'Text Area' },
  { value: RegistrationFieldType.EMAIL, label: 'Email' },
  { value: RegistrationFieldType.PHONE, label: 'Phone' },
  { value: RegistrationFieldType.NUMBER, label: 'Number' },
  { value: RegistrationFieldType.DATE, label: 'Date' },
  { value: RegistrationFieldType.SELECT, label: 'Dropdown' },
];

export default function SimpleRegistrationBuilder({ 
  initialConfig, 
  onChange
}: SimpleRegistrationBuilderProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled || false);
  const [fields, setFields] = useState<RegistrationField[]>(
    initialConfig?.fields || []
  );

  // Notify parent when config changes
  useEffect(() => {
    const config: RegistrationConfig = {
      enabled,
      fields,
      allowWaitlist: false,
      requireApproval: false,
      sendConfirmationEmail: true,
      // Keep optional fields undefined to maintain backend compatibility
      deadline: undefined,
      maxRegistrations: undefined,
      confirmationMessage: undefined,
    };
    onChange(config);
  }, [enabled, fields, onChange]);

  const addField = () => {
    const newField: RegistrationField = {
      ...defaultRegistrationField,
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: RegistrationFieldType.TEXT,
      required: false,
      order: fields.length
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<RegistrationField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleOptionsChange = (index: number, optionsText: string) => {
    const options = optionsText.split('\n').filter(opt => opt.trim());
    updateField(index, { options });
  };

  return (
    <div className="space-y-4">
      {/* Enable Registration Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="enable-registration"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="enable-registration" className="text-base font-medium cursor-pointer">
          Enable Registration
        </Label>
      </div>

      {/* Fields Section */}
      {enabled && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Add custom fields for registration (First name, Last name, and Email are included automatically)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
              <p className="text-sm">No custom fields added yet.</p>
              <p className="text-xs mt-1">Click "Add Field" to create your first field.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Field {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteField(index)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`field-${index}-label`} className="text-xs">
                        Field Label *
                      </Label>
                      <Input
                        id={`field-${index}-label`}
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="e.g., Phone Number"
                        className="h-9"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`field-${index}-type`} className="text-xs">
                        Field Type
                      </Label>
                      <select
                        id={`field-${index}-type`}
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as RegistrationFieldType })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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
                    <Label htmlFor={`field-${index}-placeholder`} className="text-xs">
                      Placeholder (Optional)
                    </Label>
                    <Input
                      id={`field-${index}-placeholder`}
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                      className="h-9"
                    />
                  </div>

                  {/* Options for Select/Dropdown */}
                  {field.type === RegistrationFieldType.SELECT && (
                    <div>
                      <Label htmlFor={`field-${index}-options`} className="text-xs">
                        Options (one per line) *
                      </Label>
                      <textarea
                        id={`field-${index}-options`}
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => handleOptionsChange(index, e.target.value)}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`field-${index}-required`}
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`field-${index}-required`} className="text-xs cursor-pointer">
                      Required Field
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

