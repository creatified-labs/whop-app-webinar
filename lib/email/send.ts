/**
 * Email Sending Functions
 * Direct email sending using Resend (no queue/cron needed)
 */

import { resend, DEFAULT_FROM_EMAIL, isEmailEnabled } from './resend';
import {
  renderConfirmationEmail,
  renderReminderEmail,
  getReminderSubject,
  renderReplayEmail,
  getReplaySubject,
} from './templates';
import { formatInTimezone } from '@/lib/utils/date';

// ============================================
// Direct Send Functions
// ============================================

/**
 * Send a registration confirmation email immediately
 */
export async function sendConfirmationEmail(data: {
  email: string;
  name: string | null;
  webinarTitle: string;
  scheduledAt: Date;
  timezone: string;
  watchUrl: string;
  addToCalendarUrl?: string;
  hostName?: string;
  companyName?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled() || !resend) {
    console.log(`Email disabled. Would send confirmation to ${data.email}`);
    return { success: true };
  }

  try {
    const formattedDate = formatInTimezone(data.scheduledAt, data.timezone, 'EEEE, MMMM d, yyyy');
    const formattedTime = formatInTimezone(data.scheduledAt, data.timezone, 'h:mm a');

    const html = renderConfirmationEmail({
      recipientName: data.name || '',
      webinarTitle: data.webinarTitle,
      webinarDate: formattedDate,
      webinarTime: formattedTime,
      timezone: data.timezone,
      watchUrl: data.watchUrl,
      addToCalendarUrl: data.addToCalendarUrl,
      hostName: data.hostName,
      companyName: data.companyName,
    });

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: data.email,
      subject: `You're registered: ${data.webinarTitle}`,
      html,
    });

    if (error) {
      console.error('Failed to send confirmation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Schedule reminder emails using Resend's scheduledAt feature
 */
export async function scheduleReminderEmails(data: {
  email: string;
  name: string | null;
  webinarTitle: string;
  scheduledAt: Date;
  timezone: string;
  watchUrl: string;
  hostName?: string;
  send24h: boolean;
  send1h: boolean;
}): Promise<{ scheduled24h: boolean; scheduled1h: boolean }> {
  if (!isEmailEnabled() || !resend) {
    console.log(`Email disabled. Would schedule reminders for ${data.email}`);
    return { scheduled24h: data.send24h, scheduled1h: data.send1h };
  }

  const formattedDate = formatInTimezone(data.scheduledAt, data.timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimezone(data.scheduledAt, data.timezone, 'h:mm a');
  const now = new Date();

  const results = { scheduled24h: false, scheduled1h: false };

  // 24 hour reminder
  if (data.send24h) {
    const reminder24h = new Date(data.scheduledAt);
    reminder24h.setHours(reminder24h.getHours() - 24);

    if (reminder24h > now) {
      try {
        const html = renderReminderEmail({
          recipientName: data.name || '',
          webinarTitle: data.webinarTitle,
          webinarDate: formattedDate,
          webinarTime: formattedTime,
          timezone: data.timezone,
          watchUrl: data.watchUrl,
          reminderType: '24h',
          hostName: data.hostName,
        });

        const { error } = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: data.email,
          subject: getReminderSubject(data.webinarTitle, '24h'),
          html,
          scheduledAt: reminder24h.toISOString(),
        });

        if (!error) {
          results.scheduled24h = true;
        } else {
          console.error('Failed to schedule 24h reminder:', error);
        }
      } catch (err) {
        console.error('Failed to schedule 24h reminder:', err);
      }
    }
  }

  // 1 hour reminder
  if (data.send1h) {
    const reminder1h = new Date(data.scheduledAt);
    reminder1h.setHours(reminder1h.getHours() - 1);

    if (reminder1h > now) {
      try {
        const html = renderReminderEmail({
          recipientName: data.name || '',
          webinarTitle: data.webinarTitle,
          webinarDate: formattedDate,
          webinarTime: formattedTime,
          timezone: data.timezone,
          watchUrl: data.watchUrl,
          reminderType: '1h',
          hostName: data.hostName,
        });

        const { error } = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: data.email,
          subject: getReminderSubject(data.webinarTitle, '1h'),
          html,
          scheduledAt: reminder1h.toISOString(),
        });

        if (!error) {
          results.scheduled1h = true;
        } else {
          console.error('Failed to schedule 1h reminder:', error);
        }
      } catch (err) {
        console.error('Failed to schedule 1h reminder:', err);
      }
    }
  }

  return results;
}

/**
 * Send a replay email immediately
 */
export async function sendReplayEmail(data: {
  email: string;
  name: string | null;
  webinarTitle: string;
  replayUrl: string;
  attended: boolean;
  hostName?: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isEmailEnabled() || !resend) {
    console.log(`Email disabled. Would send replay to ${data.email}`);
    return { success: true };
  }

  try {
    const html = renderReplayEmail({
      recipientName: data.name || '',
      webinarTitle: data.webinarTitle,
      replayUrl: data.replayUrl,
      attended: data.attended,
      hostName: data.hostName,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
    });

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: data.email,
      subject: getReplaySubject(data.webinarTitle, data.attended),
      html,
    });

    if (error) {
      console.error('Failed to send replay email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send replay email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================
// Legacy Queue Functions (kept for compatibility)
// These now send directly instead of queuing
// ============================================

/**
 * @deprecated Use sendConfirmationEmail instead
 */
export async function queueConfirmationEmail(data: {
  registrationId: string;
  email: string;
  name: string | null;
  webinarTitle: string;
  scheduledAt: Date;
  timezone: string;
  watchUrl: string;
  addToCalendarUrl?: string;
  hostName?: string;
  companyName?: string;
}): Promise<void> {
  await sendConfirmationEmail(data);
}

/**
 * @deprecated Use scheduleReminderEmails instead
 */
export async function queueReminderEmails(data: {
  registrationId: string;
  email: string;
  name: string | null;
  webinarTitle: string;
  scheduledAt: Date;
  timezone: string;
  watchUrl: string;
  hostName?: string;
  send24h: boolean;
  send1h: boolean;
}): Promise<void> {
  await scheduleReminderEmails(data);
}

/**
 * @deprecated Use sendReplayEmail instead
 */
export async function queueReplayEmail(data: {
  registrationId: string;
  email: string;
  name: string | null;
  webinarTitle: string;
  replayUrl: string;
  attended: boolean;
  hostName?: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<void> {
  await sendReplayEmail(data);
}

// These functions are no longer needed but kept for compatibility
export async function sendQueuedEmail(): Promise<boolean> {
  console.warn('sendQueuedEmail is deprecated - emails are now sent directly');
  return true;
}

export async function processEmailQueue(): Promise<{ processed: number; sent: number; failed: number }> {
  console.warn('processEmailQueue is deprecated - emails are now sent directly');
  return { processed: 0, sent: 0, failed: 0 };
}
