/**
 * Email Module Barrel Export
 */

export { resend, DEFAULT_FROM_EMAIL, isEmailEnabled } from './resend';

export {
  queueEmail,
  getEmailsToSend,
  markEmailSent,
  markEmailFailed,
  cancelPendingEmails,
  getEmailQueueStats,
  cleanupOldEmails,
} from './queue';

export {
  queueConfirmationEmail,
  queueReminderEmails,
  queueReplayEmail,
  sendQueuedEmail,
  processEmailQueue,
} from './send';

export {
  renderConfirmationEmail,
  renderReminderEmail,
  getReminderSubject,
  renderReplayEmail,
  getReplaySubject,
} from './templates';
