'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Mail, User, Phone, MessageSquare } from 'lucide-react';
import { Card, Heading, Text, Button, Switch } from '@whop/react/components';
import type { RegistrationField } from '@/types/database';

interface RegistrationFieldsConfigProps {
  fields: RegistrationField[];
  onChange: (fields: RegistrationField[]) => void;
}

const defaultFields: RegistrationField[] = [
  { id: 'name', type: 'name', label: 'Full Name', required: true },
  { id: 'email', type: 'email', label: 'Email Address', required: true },
];

const standardFieldIcons = {
  name: User,
  email: Mail,
  phone: Phone,
};

export function RegistrationFieldsConfig({ fields, onChange }: RegistrationFieldsConfigProps) {
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'textarea' | 'select'>('text');
  const [newQuestionRequired, setNewQuestionRequired] = useState(false);
  const [newQuestionOptions, setNewQuestionOptions] = useState('');

  // Check if standard fields are enabled
  const hasName = fields.some(f => f.id === 'name');
  const hasEmail = fields.some(f => f.id === 'email');
  const hasPhone = fields.some(f => f.id === 'phone');

  // Get custom questions (non-standard fields)
  const customQuestions = fields.filter(f => !['name', 'email', 'phone'].includes(f.id));

  const toggleStandardField = (fieldId: 'name' | 'email' | 'phone', enabled: boolean) => {
    if (enabled) {
      const newField: RegistrationField = {
        id: fieldId,
        type: fieldId,
        label: fieldId === 'name' ? 'Full Name' : fieldId === 'email' ? 'Email Address' : 'Phone Number',
        required: fieldId === 'email', // Email is always required
      };
      // Insert standard fields at the beginning, in order
      const standardOrder = ['name', 'email', 'phone'];
      const newFields = [...fields];
      const insertIndex = newFields.findIndex(f =>
        standardOrder.indexOf(f.id) > standardOrder.indexOf(fieldId)
      );
      if (insertIndex === -1) {
        // Find where custom questions start
        const customStart = newFields.findIndex(f => !['name', 'email', 'phone'].includes(f.id));
        if (customStart === -1) {
          newFields.push(newField);
        } else {
          newFields.splice(customStart, 0, newField);
        }
      } else {
        newFields.splice(insertIndex, 0, newField);
      }
      onChange(newFields);
    } else {
      onChange(fields.filter(f => f.id !== fieldId));
    }
  };

  const toggleFieldRequired = (fieldId: string) => {
    onChange(fields.map(f =>
      f.id === fieldId ? { ...f, required: !f.required } : f
    ));
  };

  const addCustomQuestion = () => {
    if (!newQuestionLabel.trim()) return;

    const newField: RegistrationField = {
      id: `custom_${Date.now()}`,
      type: newQuestionType,
      label: newQuestionLabel.trim(),
      required: newQuestionRequired,
      placeholder: newQuestionType !== 'select' ? `Enter your ${newQuestionLabel.toLowerCase()}` : undefined,
      options: newQuestionType === 'select' ? newQuestionOptions.split('\n').filter(o => o.trim()) : undefined,
    };

    onChange([...fields, newField]);
    setNewQuestionLabel('');
    setNewQuestionType('text');
    setNewQuestionRequired(false);
    setNewQuestionOptions('');
    setShowAddQuestion(false);
  };

  const removeCustomQuestion = (fieldId: string) => {
    onChange(fields.filter(f => f.id !== fieldId));
  };

  const updateCustomQuestion = (fieldId: string, updates: Partial<RegistrationField>) => {
    onChange(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  return (
    <div className="space-y-6">
      {/* Standard Fields */}
      <div>
        <Text size="2" weight="medium" className="mb-3 text-gray-12">
          Standard Fields
        </Text>
        <div className="space-y-2">
          <StandardFieldToggle
            icon={User}
            label="Full Name"
            description="Collect registrant's full name"
            enabled={hasName}
            required={fields.find(f => f.id === 'name')?.required ?? false}
            onToggle={(enabled) => toggleStandardField('name', enabled)}
            onRequiredChange={() => toggleFieldRequired('name')}
            canDisable={true}
          />
          <StandardFieldToggle
            icon={Mail}
            label="Email Address"
            description="Required for sending confirmations and reminders"
            enabled={hasEmail}
            required={true}
            onToggle={(enabled) => toggleStandardField('email', enabled)}
            onRequiredChange={() => {}}
            canDisable={false}
            alwaysRequired={true}
          />
          <StandardFieldToggle
            icon={Phone}
            label="Phone Number"
            description="Collect registrant's phone number"
            enabled={hasPhone}
            required={fields.find(f => f.id === 'phone')?.required ?? false}
            onToggle={(enabled) => toggleStandardField('phone', enabled)}
            onRequiredChange={() => toggleFieldRequired('phone')}
            canDisable={true}
          />
        </div>
      </div>

      {/* Custom Questions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Text size="2" weight="medium" className="text-gray-12">
            Custom Questions
          </Text>
          <Button
            type="button"
            size="1"
            variant="soft"
            onClick={() => setShowAddQuestion(true)}
          >
            <Plus className="h-3 w-3" />
            Add Question
          </Button>
        </div>

        {customQuestions.length === 0 && !showAddQuestion && (
          <div className="rounded-2 border border-dashed border-gray-a6 p-4 text-center">
            <MessageSquare className="mx-auto h-6 w-6 text-gray-9" />
            <Text size="2" color="gray" className="mt-2">
              No custom questions yet
            </Text>
            <Text size="1" color="gray">
              Add questions to learn more about your registrants
            </Text>
          </div>
        )}

        {customQuestions.length > 0 && (
          <div className="space-y-2">
            {customQuestions.map((field) => (
              <CustomQuestionCard
                key={field.id}
                field={field}
                onUpdate={(updates) => updateCustomQuestion(field.id, updates)}
                onRemove={() => removeCustomQuestion(field.id)}
              />
            ))}
          </div>
        )}

        {/* Add Question Form */}
        {showAddQuestion && (
          <Card size="2" className="mt-3">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-2 font-medium text-gray-12">
                  Question
                </label>
                <input
                  type="text"
                  value={newQuestionLabel}
                  onChange={(e) => setNewQuestionLabel(e.target.value)}
                  placeholder="e.g., What is your company name?"
                  className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-2 font-medium text-gray-12">
                    Answer Type
                  </label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value as 'text' | 'textarea' | 'select')}
                    className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text</option>
                    <option value="select">Multiple Choice</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={newQuestionRequired}
                    onCheckedChange={setNewQuestionRequired}
                  />
                  <Text size="2" color="gray">
                    Required
                  </Text>
                </div>
              </div>

              {newQuestionType === 'select' && (
                <div>
                  <label className="mb-1.5 block text-2 font-medium text-gray-12">
                    Options (one per line)
                  </label>
                  <textarea
                    value={newQuestionOptions}
                    onChange={(e) => setNewQuestionOptions(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                    className="w-full resize-none rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    setShowAddQuestion(false);
                    setNewQuestionLabel('');
                    setNewQuestionType('text');
                    setNewQuestionRequired(false);
                    setNewQuestionOptions('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="2"
                  variant="solid"
                  onClick={addCustomQuestion}
                  disabled={!newQuestionLabel.trim()}
                >
                  Add Question
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

interface StandardFieldToggleProps {
  icon: typeof User;
  label: string;
  description: string;
  enabled: boolean;
  required: boolean;
  onToggle: (enabled: boolean) => void;
  onRequiredChange: () => void;
  canDisable: boolean;
  alwaysRequired?: boolean;
}

function StandardFieldToggle({
  icon: Icon,
  label,
  description,
  enabled,
  required,
  onToggle,
  onRequiredChange,
  canDisable,
  alwaysRequired,
}: StandardFieldToggleProps) {
  return (
    <div className={`flex items-center justify-between rounded-2 border p-3 transition-colors ${
      enabled ? 'border-gray-a6 bg-gray-a2' : 'border-gray-a4'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-2 p-2 ${enabled ? 'bg-accent-a3 text-accent-11' : 'bg-gray-a3 text-gray-9'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Text size="2" weight="medium" className={enabled ? '' : 'text-gray-11'}>
            {label}
          </Text>
          <Text size="1" color="gray">
            {description}
          </Text>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {enabled && !alwaysRequired && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={onRequiredChange}
              className="h-4 w-4 rounded border-gray-a6 text-accent-9 focus:ring-accent-8"
            />
            <Text size="1" color="gray">Required</Text>
          </label>
        )}
        {alwaysRequired && enabled && (
          <Text size="1" color="gray">Always required</Text>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={!canDisable && enabled}
        />
      </div>
    </div>
  );
}

interface CustomQuestionCardProps {
  field: RegistrationField;
  onUpdate: (updates: Partial<RegistrationField>) => void;
  onRemove: () => void;
}

function CustomQuestionCard({ field, onUpdate, onRemove }: CustomQuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-2 border border-gray-a6 bg-gray-a2 p-3">
      <div className="mt-1 cursor-grab text-gray-9">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Text size="2" weight="medium" className="truncate">
              {field.label}
            </Text>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-1 bg-gray-a3 px-2 py-0.5 text-1 text-gray-11">
                {field.type === 'text' ? 'Short text' : field.type === 'textarea' ? 'Long text' : 'Multiple choice'}
              </span>
              {field.required && (
                <span className="rounded-1 bg-accent-a3 px-2 py-0.5 text-1 text-accent-11">
                  Required
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-1 p-1 text-gray-9 transition-colors hover:bg-red-a3 hover:text-red-11"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {field.type === 'select' && field.options && (
          <div className="mt-2 flex flex-wrap gap-1">
            {field.options.map((option, i) => (
              <span key={i} className="rounded-1 bg-gray-a3 px-2 py-0.5 text-1 text-gray-11">
                {option}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { defaultFields };
