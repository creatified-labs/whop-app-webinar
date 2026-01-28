/**
 * Email Sending Functions
 * Functions to send various types of webinar emails
 */

import { resend, DEFAULT_FROM_EMAIL, isEmailEnabled } from './resend';
import { queueEmail, getEmailsToSend, markEmailSent, markEmailFailed } from './queue';
import {
  renderConfirmationEmail,
  renderReminderEmail,
  getReminderSubject,
  renderReplayEmail,
  getReplaySubject,
} from './templates';
import { formatInTimezone } from '@/lib/utils/date';
import type { EmailQueueItem, EmailType } from '@/types/database';

// ============================================
// Queue Functions (Schedule emails)
// ============================================

/**
 * Queue a registration confirmation email
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
  const formattedDate = formatInTimezone(data.scheduledAt, data.timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimezone(data.scheduledAt, data.timezone, 'h:mm a');

  await queueEmail({
    emailType: 'confirmation',
    registrationId: data.registrationId,
    toEmail: data.email,
    toName: data.name,
    subject: `You're registered: ${data.webinarTitle}`,
    templateData: {
      recipientName: data.name || '',
      webinarTitle: data.webinarTitle,
      webinarDate: formattedDate,
      webinarTime: formattedTime,
      timezone: data.timezone,
      watchUrl: data.watchUrl,
      addToCalendarUrl: data.addToCalendarUrl,
      hostName: data.hostName,
      companyName: data.companyName,
    },
    scheduledFor: new Date(), // Send immediately
  });
}

/**
 * Queue reminder emails (24h and 1h before)
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
  const formattedDate = formatInTimezone(data.scheduledAt, data.timezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimezone(data.scheduledAt, data.timezone, 'h:mm a');

  const baseTemplateData = {
    recipientName: data.name || '',
    webinarTitle: data.webinarTitle,
    webinarDate: formattedDate,
    webinarTime: formattedTime,
    timezone: data.timezone,
    watchUrl: data.watchUrl,
    hostName: data.hostName,
  };

  // 24 hour reminder
  if (data.send24h) {
    const reminder24h = new Date(data.scheduledAt);
    reminder24h.setHours(reminder24h.getHours() - 24);

    // Only queue if it's in the future
    if (reminder24h > new Date()) {
      await queueEmail({
        emailType: 'reminder_24h',
        registrationId: data.registrationId,
        toEmail: data.email,
        toName: data.name,
        subject: getReminderSubject(data.webinarTitle, '24h'),
        templateData: { ...baseTemplateData, reminderType: '24h' },
        scheduledFor: reminder24h,
      });
    }
  }

  // 1 hour reminder
  if (data.send1h) {
    const reminder1h = new Date(data.scheduledAt);
    reminder1h.setHours(reminder1h.getHours() - 1);

    // Only queue if it's in the future
    if (reminder1h > new Date()) {
      await queueEmail({
        emailType: 'reminder_1h',
        registrationId: data.registrationId,
        toEmail: data.email,
        toName: data.name,
        subject: getReminderSubject(data.webinarTitle, '1h'),
        templateData: { ...baseTemplateData, reminderType: '1h' },
        scheduledFor: reminder1h,
      });
    }
  }
}

/**
 * Queue replay email
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
  await queueEmail({
    emailType: 'replay',
    registrationId: data.registrationId,
    toEmail: data.email,
    toName: data.name,
    subject: getReplaySubject(data.webinarTitle, data.attended),
    templateData: {
      recipientName: data.name || '',
      webinarTitle: data.webinarTitle,
      replayUrl: data.replayUrl,
      attended: data.attended,
      hostName: data.hostName,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
    },
    scheduledFor: new Date(), // Send immediately
  });
}

// ============================================
// Send Functions (Process queue)
// ============================================

/**
 * Send a single email from the queue
 */
export async function sendQueuedEmail(email: EmailQueueItem): Promise<boolean> {
  if (!isEmailEnabled() || !resend) {
    console.log(`Email sending disabled. Would send ${email.email_type} to ${email.to_email}`);
    await markEmailSent(email.id);
    return true;
  }

  try {
    const html = renderEmailHtml(email);

    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: email.to_email,
      subject: email.subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    await markEmailSent(email.id);
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to send email ${email.id}:`, errorMessage);
    await markEmailFailed(email.id, errorMessage);
    return false;
  }
}

/**
 * Process the email queue
 */
export async function processEmailQueue(limit: number = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const emails = await getEmailsToSend(limit);

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const success = await sendQueuedEmail(email);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    processed: emails.length,
    sent,
    failed,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Render email HTML based on type
 */
function renderEmailHtml(email: EmailQueueItem): string {
  const data = email.template_data as Record<string, unknown>;

  switch (email.email_type) {
    case 'confirmation':
      return renderConfirmationEmail({
        recipientName: data.recipientName as string,
        webinarTitle: data.webinarTitle as string,
        webinarDate: data.webinarDate as string,
        webinarTime: data.webinarTime as string,
        timezone: data.timezone as string,
        watchUrl: data.watchUrl as string,
        addToCalendarUrl: data.addToCalendarUrl as string | undefined,
        hostName: data.hostName as string | undefined,
        companyName: data.companyName as string | undefined,
      });

    case 'reminder_24h':
    case 'reminder_1h':
      return renderReminderEmail({
        recipientName: data.recipientName as string,
        webinarTitle: data.webinarTitle as string,
        webinarDate: data.webinarDate as string,
        webinarTime: data.webinarTime as string,
        timezone: data.timezone as string,
        watchUrl: data.watchUrl as string,
        reminderType: data.reminderType as '24h' | '1h',
        hostName: data.hostName as string | undefined,
      });

    case 'replay':
      return renderReplayEmail({
        recipientName: data.recipientName as string,
        webinarTitle: data.webinarTitle as string,
        replayUrl: data.replayUrl as string,
        attended: data.attended as boolean,
        hostName: data.hostName as string | undefined,
        ctaText: data.ctaText as string | undefined,
        ctaUrl: data.ctaUrl as string | undefined,
      });

    default:
      throw new Error(`Unknown email type: ${email.email_type}`);
  }
}
