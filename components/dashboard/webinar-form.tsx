'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@whop/react/components';
import { COMMON_TIMEZONES } from '@/lib/utils/date';
import { createWebinar, updateWebinar } from '@/app/actions/webinar';
import type { Webinar, VideoType } from '@/types/database';

interface WebinarFormProps {
  companyId: string;
  webinar?: Webinar;
  mode: 'create' | 'edit';
}

/**
 * Webinar Form
 * Create/edit webinar form with all configuration options
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter webinar title"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your webinar..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
              Cover Image URL
            </label>
            <input
              id="coverImage"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Schedule</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700">
              Date & Time *
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              min={5}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </section>

      {/* Video Settings */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Video Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="videoType" className="block text-sm font-medium text-gray-700">
              Video Type
            </label>
            <select
              id="videoType"
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as VideoType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="hls">HLS Stream</option>
              <option value="custom">Custom URL</option>
            </select>
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">
              Live Video URL
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="replayUrl" className="block text-sm font-medium text-gray-700">
              Replay URL (optional)
            </label>
            <input
              id="replayUrl"
              type="url"
              value={replayUrl}
              onChange={(e) => setReplayUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </section>

      {/* CTA Settings */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Call to Action</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700">
              CTA Button Text
            </label>
            <input
              id="ctaText"
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Get Started"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="ctaUrl" className="block text-sm font-medium text-gray-700">
              CTA URL
            </label>
            <input
              id="ctaUrl"
              type="url"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            label="Show Host Info"
            checked={showHostInfo}
            onChange={setShowHostInfo}
          />
          <Toggle
            label="Live Chat"
            checked={chatEnabled}
            onChange={setChatEnabled}
          />
          <Toggle
            label="Q&A"
            checked={qaEnabled}
            onChange={setQaEnabled}
          />
          <Toggle
            label="Polls"
            checked={pollsEnabled}
            onChange={setPollsEnabled}
          />
          <Toggle
            label="Reactions"
            checked={reactionsEnabled}
            onChange={setReactionsEnabled}
          />
        </div>
      </section>

      {/* Email Settings */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Email Notifications</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            label="Send Confirmation Email"
            checked={sendConfirmation}
            onChange={setSendConfirmation}
          />
          <Toggle
            label="Send 24h Reminder"
            checked={sendReminder24h}
            onChange={setSendReminder24h}
          />
          <Toggle
            label="Send 1h Reminder"
            checked={sendReminder1h}
            onChange={setSendReminder1h}
          />
          <Toggle
            label="Send Replay Email"
            checked={sendReplayEmail}
            onChange={setSendReplayEmail}
          />
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="soft"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="solid" disabled={isPending}>
          {isPending
            ? 'Saving...'
            : mode === 'create'
            ? 'Create Webinar'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
