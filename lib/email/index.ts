/**
 * Email Module Barrel Export
 *
 * Primary API (Direct Resend Sending):
 * - sendConfirmationEmail: Send registration confirmation immediately
 * - scheduleReminderEmails: Schedule 24h/1h reminders via Resend
 * - sendReplayEmail: Send replay notification immediately
 *
 * Legacy API (Deprecated - kept for compatibility):
 * - queueConfirmationEmail, queueReminderEmails, queueReplayEmail
 * - These now call the direct send functions internally
 */

export { resend, DEFAULT_FROM_EMAIL, isEmailEnabled } from './resend';

// Primary API - Direct sending via Resend
export {
  sendConfirmationEmail,
  scheduleReminderEmails,
  sendReplayEmail,
} from './send';

// Legacy API - Deprecated wrappers (kept for compatibility)
export {
  queueConfirmationEmail,
  queueReminderEmails,
  queueReplayEmail,
  sendQueuedEmail,
  processEmailQueue,
} from './send';

// Templates (still used internally)
export {
  renderConfirmationEmail,
  renderReminderEmail,
  getReminderSubject,
  renderReplayEmail,
  getReplaySubject,
} from './templates';

// Queue functions - Deprecated (no longer needed with direct sending)
// Kept for manual cleanup/migration if needed
export {
  queueEmail,
  getEmailsToSend,
  markEmailSent,
  markEmailFailed,
  cancelPendingEmails,
  getEmailQueueStats,
  cleanupOldEmails,
} from './queue';
