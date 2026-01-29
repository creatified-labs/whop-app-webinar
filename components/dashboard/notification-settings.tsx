'use client';

import { useState, useTransition } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Card, Heading, Text, Button, Switch } from '@whop/react/components';
import { updateNotificationSettings } from '@/app/actions/settings';

interface NotificationSettingsProps {
  whopCompanyId: string;
  initialSettings?: {
    email_on_registration: boolean;
    email_on_webinar_start: boolean;
  };
}

export function NotificationSettings({
  whopCompanyId,
  initialSettings = {
    email_on_registration: true,
    email_on_webinar_start: true,
  },
}: NotificationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    settings.email_on_registration !== initialSettings.email_on_registration ||
    settings.email_on_webinar_start !== initialSettings.email_on_webinar_start;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateNotificationSettings(whopCompanyId, settings);

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
          Notifications
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Configure when you receive email notifications
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email on Registration */}
        <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2 bg-blue-a3 p-2">
              <Bell className="h-4 w-4 text-blue-11" />
            </div>
            <div>
              <Text as="p" size="2" weight="medium">
                New Registration
              </Text>
              <Text as="p" size="1" color="gray">
                Get notified when someone registers for your webinar
              </Text>
            </div>
          </div>
          <Switch
            checked={settings.email_on_registration}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, email_on_registration: checked }))
            }
          />
        </div>

        {/* Email on Webinar Start */}
        <div className="flex items-center justify-between rounded-2 border border-gray-a4 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2 bg-green-a3 p-2">
              <Bell className="h-4 w-4 text-green-11" />
            </div>
            <div>
              <Text as="p" size="2" weight="medium">
                Webinar Starting
              </Text>
              <Text as="p" size="1" color="gray">
                Get notified when your webinar is about to start
              </Text>
            </div>
          </div>
          <Switch
            checked={settings.email_on_webinar_start}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, email_on_webinar_start: checked }))
            }
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Text size="2" color="red">
            {error}
          </Text>
        )}
        {success && (
          <Text size="2" color="green">
            Notification settings saved
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
