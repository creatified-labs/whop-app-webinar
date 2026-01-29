'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Info,
  Calendar,
  Video,
  MousePointer,
  Settings2,
  Mail,
  Loader2,
  Check,
  ClipboardList,
} from 'lucide-react';
import { Card, Heading, Text, Button } from '@whop/react/components';
import { COMMON_TIMEZONES } from '@/lib/utils/date';
import { createWebinar, updateWebinar } from '@/app/actions/webinar';
import { RegistrationFieldsConfig, defaultFields } from './registration-fields-config';
import type { Webinar, VideoType, RegistrationField } from '@/types/database';

interface WebinarFormProps {
  companyId: string;
  webinar?: Webinar;
  mode: 'create' | 'edit';
}

/**
 * Webinar Form
 * Modern multi-section form for creating/editing webinars
 */
export function WebinarForm({ companyId, webinar, mode }: WebinarFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(webinar?.title || '');
  const [description, setDescription] = useState(webinar?.description || '');
  const [scheduledAt, setScheduledAt] = useState(
    webinar?.scheduled_at
      ? new Date(webinar.scheduled_at).toISOString().slice(0, 16)
      : ''
  );
  const [durationMinutes, setDurationMinutes] = useState(
    webinar?.duration_minutes || 60
  );
  const [timezone, setTimezone] = useState(
    webinar?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [videoType, setVideoType] = useState(webinar?.video_type || 'youtube');
  const [videoUrl, setVideoUrl] = useState(webinar?.video_url || '');
  const [replayUrl, setReplayUrl] = useState(webinar?.replay_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(webinar?.cover_image_url || '');
  const [ctaText, setCtaText] = useState(webinar?.cta_text || '');
  const [ctaUrl, setCtaUrl] = useState(webinar?.cta_url || '');

  // Feature toggles
  const [showHostInfo, setShowHostInfo] = useState(webinar?.show_host_info ?? true);
  const [chatEnabled, setChatEnabled] = useState(webinar?.chat_enabled ?? true);
  const [qaEnabled, setQaEnabled] = useState(webinar?.qa_enabled ?? true);
  const [pollsEnabled, setPollsEnabled] = useState(webinar?.polls_enabled ?? true);
  const [reactionsEnabled, setReactionsEnabled] = useState(webinar?.reactions_enabled ?? true);

  // Email settings
  const [sendConfirmation, setSendConfirmation] = useState(webinar?.send_confirmation_email ?? true);
  const [sendReminder1h, setSendReminder1h] = useState(webinar?.send_reminder_1h ?? true);
  const [sendReminder24h, setSendReminder24h] = useState(webinar?.send_reminder_24h ?? true);
  const [sendReplayEmail, setSendReplayEmail] = useState(webinar?.send_replay_email ?? true);

  // Registration form fields
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>(
    (webinar as any)?.registration_fields ?? defaultFields
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!scheduledAt) {
      setError('Scheduled date and time is required');
      return;
    }

    startTransition(async () => {
      const formData = {
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: durationMinutes,
        timezone,
        video_type: videoType as 'youtube' | 'vimeo' | 'hls' | 'custom',
        video_url: videoUrl.trim() || undefined,
        replay_url: replayUrl.trim() || undefined,
        cover_image_url: coverImageUrl.trim() || undefined,
        cta_text: ctaText.trim() || undefined,
        cta_url: ctaUrl.trim() || undefined,
        show_host_info: showHostInfo,
        chat_enabled: chatEnabled,
        qa_enabled: qaEnabled,
        polls_enabled: pollsEnabled,
        reactions_enabled: reactionsEnabled,
        send_confirmation_email: sendConfirmation,
        send_reminder_1h: sendReminder1h,
        send_reminder_24h: sendReminder24h,
        send_replay_email: sendReplayEmail,
        registration_fields: registrationFields,
      };

      let result;
      if (mode === 'create') {
        result = await createWebinar(companyId, formData);
      } else if (webinar) {
        result = await updateWebinar(webinar.id, formData);
      }

      if (result?.success && result.data) {
        router.push(`/dashboard/${companyId}/webinars/${result.data.id}`);
      } else {
        setError(result?.error || 'Failed to save webinar');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <FormSection
        icon={Info}
        title="Basic Information"
        description="Set up the main details for your webinar"
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to Build a Successful SaaS"
              required
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your audience what they'll learn..."
              rows={4}
              className="w-full resize-none rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>

          <FormField label="Cover Image URL">
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
            <Text size="1" color="gray" className="mt-1.5">
              Recommended size: 1920x1080 (16:9 aspect ratio)
            </Text>
          </FormField>
        </div>
      </FormSection>

      {/* Schedule */}
      <FormSection
        icon={Calendar}
        title="Schedule"
        description="When will your webinar take place?"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Date & Time" required>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>

          <FormField label="Duration">
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </FormField>

          <FormField label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      {/* Video Settings */}
      <FormSection
        icon={Video}
        title="Video Settings"
        description="Configure your video source"
      >
        <div className="space-y-4">
          <FormField label="Video Platform">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['youtube', 'vimeo', 'hls', 'custom'] as VideoType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVideoType(type)}
                  className={`rounded-2 border-2 px-4 py-2.5 text-2 font-medium transition-all ${
                    videoType === type
                      ? 'border-accent-9 bg-accent-a3 text-accent-11'
                      : 'border-gray-a6 text-gray-11 hover:border-gray-a8'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Live Video URL">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder={
                videoType === 'youtube'
                  ? 'https://youtube.com/watch?v=...'
                  : videoType === 'vimeo'
                  ? 'https://vimeo.com/...'
                  : 'https://...'
              }
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>

          <FormField label="Replay URL (optional)">
            <input
              type="url"
              value={replayUrl}
              onChange={(e) => setReplayUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>
        </div>
      </FormSection>

      {/* CTA Settings */}
      <FormSection
        icon={MousePointer}
        title="Call to Action"
        description="Add a CTA button to drive conversions"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Button Text">
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g., Get Started, Buy Now, Learn More"
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>

          <FormField label="Button URL">
            <input
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2.5 text-2 text-gray-12 placeholder:text-gray-9 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Registration Form */}
      <FormSection
        icon={ClipboardList}
        title="Registration Form"
        description="Configure what information to collect from registrants"
      >
        <RegistrationFieldsConfig
          fields={registrationFields}
          onChange={setRegistrationFields}
        />
      </FormSection>

      {/* Features */}
      <FormSection
        icon={Settings2}
        title="Features"
        description="Enable or disable interactive features"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleCard
            label="Host Information"
            description="Show host details on landing page"
            checked={showHostInfo}
            onChange={setShowHostInfo}
          />
          <ToggleCard
            label="Live Chat"
            description="Allow attendees to chat during webinar"
            checked={chatEnabled}
            onChange={setChatEnabled}
          />
          <ToggleCard
            label="Q&A"
            description="Let attendees submit questions"
            checked={qaEnabled}
            onChange={setQaEnabled}
          />
          <ToggleCard
            label="Polls"
            description="Create interactive polls"
            checked={pollsEnabled}
            onChange={setPollsEnabled}
          />
          <ToggleCard
            label="Reactions"
            description="Allow emoji reactions"
            checked={reactionsEnabled}
            onChange={setReactionsEnabled}
          />
        </div>
      </FormSection>

      {/* Email Settings */}
      <FormSection
        icon={Mail}
        title="Email Notifications"
        description="Automated emails for your registrants"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            label="Confirmation Email"
            description="Send when someone registers"
            checked={sendConfirmation}
            onChange={setSendConfirmation}
          />
          <ToggleCard
            label="24-Hour Reminder"
            description="Send 24 hours before webinar"
            checked={sendReminder24h}
            onChange={setSendReminder24h}
          />
          <ToggleCard
            label="1-Hour Reminder"
            description="Send 1 hour before webinar"
            checked={sendReminder1h}
            onChange={setSendReminder1h}
          />
          <ToggleCard
            label="Replay Available"
            description="Send when replay is ready"
            checked={sendReplayEmail}
            onChange={setSendReplayEmail}
          />
        </div>
      </FormSection>

      {/* Error */}
      {error && (
        <div className="rounded-2 border border-red-a6 bg-red-a3 p-4 text-2 text-red-11">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-a4 pt-6">
        <Button
          type="button"
          variant="soft"
          color="gray"
          size="2"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="solid"
          size="2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Create Webinar'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}

interface FormSectionProps {
  icon: typeof Info;
  title: string;
  description: string;
  children: React.ReactNode;
}

function FormSection({ icon: Icon, title, description, children }: FormSectionProps) {
  return (
    <Card size="2">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-2 bg-gray-a3 p-2">
          <Icon className="h-5 w-5 text-gray-11" />
        </div>
        <div>
          <Heading size="4" weight="semi-bold">
            {title}
          </Heading>
          <Text size="2" color="gray">
            {description}
          </Text>
        </div>
      </div>
      {children}
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-2 font-medium text-gray-12">
        {label}
        {required && <span className="ml-1 text-red-11">*</span>}
      </label>
      {children}
    </div>
  );
}

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleCard({ label, description, checked, onChange }: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 rounded-2 border-2 p-3 text-left transition-all ${
        checked
          ? 'border-accent-9 bg-accent-a3'
          : 'border-gray-a6 hover:border-gray-a8'
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-1 transition-colors ${
          checked ? 'bg-accent-9' : 'bg-gray-a5'
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <div>
        <Text as="p" size="2" weight="medium" className={checked ? 'text-accent-11' : ''}>
          {label}
        </Text>
        <Text as="p" size="1" color="gray">
          {description}
        </Text>
      </div>
    </button>
  );
}
