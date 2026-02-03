'use client';

import { useState, useTransition } from 'react';
import { Settings, MessageSquare, HelpCircle, BarChart3, Smile, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Button, Switch } from '@whop/react/components';
import { updateDefaultWebinarSettings } from '@/app/actions/settings';

interface DefaultWebinarSettingsProps {
  whopCompanyId: string;
  initialSettings?: {
    default_timezone: string;
    default_duration_minutes: number;
    chat_enabled: boolean;
    qa_enabled: boolean;
    polls_enabled: boolean;
    reactions_enabled: boolean;
  };
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

const durations = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function DefaultWebinarSettings({
  whopCompanyId,
  initialSettings = {
    default_timezone: 'America/New_York',
    default_duration_minutes: 60,
    chat_enabled: true,
    qa_enabled: true,
    polls_enabled: true,
    reactions_enabled: true,
  },
}: DefaultWebinarSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateDefaultWebinarSettings(whopCompanyId, settings);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card size="2">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          Default Webinar Settings
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Configure default settings for new webinars
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Timezone */}
        <div>
          <label className="block text-2 font-medium text-gray-12 mb-1">
            Default Timezone
          </label>
          <select
            value={settings.default_timezone}
            onChange={(e) => setSettings((s) => ({ ...s, default_timezone: e.target.value }))}
            className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-2 font-medium text-gray-12 mb-1">
            Default Duration
          </label>
          <select
            value={settings.default_duration_minutes}
            onChange={(e) =>
              setSettings((s) => ({ ...s, default_duration_minutes: parseInt(e.target.value, 10) }))
            }
            className="w-full rounded-2 border border-gray-a6 bg-gray-1 px-3 py-2 text-2 text-gray-12 focus:border-accent-8 focus:outline-none focus:ring-1 focus:ring-accent-8"
          >
            {durations.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <Text size="2" weight="medium" className="text-gray-12">
            Default Features
          </Text>

          <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2 bg-blue-a3 p-2">
                <MessageSquare className="h-4 w-4 text-blue-11" />
              </div>
              <div className="flex flex-col">
                <Text size="2" weight="medium">
                  Chat
                </Text>
                <Text size="1" color="gray">
                  Enable live chat during webinars
                </Text>
              </div>
            </div>
            <Switch
              checked={settings.chat_enabled}
              onCheckedChange={(checked) => setSettings((s) => ({ ...s, chat_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2 bg-purple-a3 p-2">
                <HelpCircle className="h-4 w-4 text-purple-11" />
              </div>
              <div className="flex flex-col">
                <Text size="2" weight="medium">
                  Q&A
                </Text>
                <Text size="1" color="gray">
                  Enable question and answer feature
                </Text>
              </div>
            </div>
            <Switch
              checked={settings.qa_enabled}
              onCheckedChange={(checked) => setSettings((s) => ({ ...s, qa_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2 bg-green-a3 p-2">
                <BarChart3 className="h-4 w-4 text-green-11" />
              </div>
              <div className="flex flex-col">
                <Text size="2" weight="medium">
                  Polls
                </Text>
                <Text size="1" color="gray">
                  Enable interactive polls
                </Text>
              </div>
            </div>
            <Switch
              checked={settings.polls_enabled}
              onCheckedChange={(checked) => setSettings((s) => ({ ...s, polls_enabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2 bg-orange-a3 p-2">
                <Smile className="h-4 w-4 text-orange-11" />
              </div>
              <div className="flex flex-col">
                <Text size="2" weight="medium">
                  Reactions
                </Text>
                <Text size="1" color="gray">
                  Enable emoji reactions
                </Text>
              </div>
            </div>
            <Switch
              checked={settings.reactions_enabled}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, reactions_enabled: checked }))
              }
            />
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}
        {success && (
          <Text size="2" color="green">
            Default settings saved
          </Text>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="2"
            variant="solid"
            disabled={isPending || !hasChanges}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
