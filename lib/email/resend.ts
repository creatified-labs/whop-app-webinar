/**
 * Resend Email Client
 * Setup and configuration for Resend email service
 */

import { Resend } from 'resend';

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email sending will be disabled.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email (update with your verified domain)
export const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'Webinar <onboarding@resend.dev>';

// Check if email is enabled
export function isEmailEnabled(): boolean {
  return resend !== null;
}
