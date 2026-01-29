/**
 * Email Queue Management (DEPRECATED)
 *
 * NOTE: The email queue is NO LONGER USED for sending emails.
 * Emails are now sent directly via Resend (see lib/email/send.ts).
 *
 * These functions are kept for:
 * - Backward compatibility during migration
 * - Manual cleanup of existing queue entries
 * - Potential future use for bulk operations
 *
 * @deprecated Use direct Resend sending instead (lib/email/send.ts)
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { EmailQueueItem, EmailType, EmailStatus } from '@/types/database';

// ============================================
// Queue Operations
// ============================================

/**
 * Add an email to the queue
 */
export async function queueEmail(data: {
  emailType: EmailType;
  registrationId: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  templateData: Record<string, unknown>;
  scheduledFor: Date;
}): Promise<EmailQueueItem> {
  const supabase = createAdminClient();

  const { data: email, error } = await supabase
    .from('email_queue')
    .insert({
      email_type: data.emailType,
      registration_id: data.registrationId,
      to_email: data.toEmail,
      to_name: data.toName,
      subject: data.subject,
      template_data: data.templateData,
      scheduled_for: data.scheduledFor.toISOString(),
      max_attempts: 3,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to queue email: ${error.message}`);
  }

  return email;
}

/**
 * Get emails ready to be sent
 */
export async function getEmailsToSend(limit: number = 50): Promise<EmailQueueItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', 3) // Don't retry more than 3 times
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get emails: ${error.message}`);
  }

  return data;
}

/**
 * Mark email as sent
 */
export async function markEmailSent(emailId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('email_queue')
    .update({
      status: 'sent' as EmailStatus,
      sent_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  if (error) {
    throw new Error(`Failed to mark email as sent: ${error.message}`);
  }
}

/**
 * Mark email as failed
 */
export async function markEmailFailed(
  emailId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createAdminClient();

  // Get current attempt count
  const { data: email } = await supabase
    .from('email_queue')
    .select('attempts, max_attempts')
    .eq('id', emailId)
    .single();

  const newAttempts = (email?.attempts || 0) + 1;
  const maxAttempts = email?.max_attempts || 3;

  const { error } = await supabase
    .from('email_queue')
    .update({
      status: newAttempts >= maxAttempts ? ('failed' as EmailStatus) : ('pending' as EmailStatus),
      error_message: errorMessage,
      attempts: newAttempts,
    })
    .eq('id', emailId);

  if (error) {
    throw new Error(`Failed to mark email as failed: ${error.message}`);
  }
}

/**
 * Cancel pending emails for a registration
 */
export async function cancelPendingEmails(
  registrationId: string,
  emailTypes?: EmailType[]
): Promise<number> {
  const supabase = createAdminClient();

  let query = supabase
    .from('email_queue')
    .delete()
    .eq('registration_id', registrationId)
    .eq('status', 'pending');

  if (emailTypes && emailTypes.length > 0) {
    query = query.in('email_type', emailTypes);
  }

  const { data, error } = await query.select('id');

  if (error) {
    throw new Error(`Failed to cancel emails: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Get email queue stats
 */
export async function getEmailQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
}> {
  const supabase = createAdminClient();

  const [pending, sent, failed] = await Promise.all([
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed'),
  ]);

  return {
    pending: pending.count || 0,
    sent: sent.count || 0,
    failed: failed.count || 0,
  };
}

/**
 * Clean up old sent/failed emails
 */
export async function cleanupOldEmails(olderThanDays: number = 30): Promise<number> {
  const supabase = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from('email_queue')
    .delete()
    .in('status', ['sent', 'failed'])
    .lt('created_at', cutoff.toISOString())
    .select('id');

  if (error) {
    throw new Error(`Failed to cleanup emails: ${error.message}`);
  }

  return data?.length || 0;
}
