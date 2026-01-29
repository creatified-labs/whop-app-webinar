/**
 * Send Emails Cron Job (DEPRECATED)
 *
 * NOTE: This cron job is NO LONGER NEEDED.
 * Emails are now sent directly via Resend when events occur:
 * - Confirmation emails: Sent immediately on registration
 * - Reminder emails: Scheduled via Resend's scheduledAt feature
 * - Replay emails: Sent when webinar status transitions to 'ended'
 *
 * This endpoint is kept for:
 * - Backward compatibility
 * - Manual cleanup of old queue entries if migrating
 *
 * @deprecated Use direct Resend sending instead (lib/email/send.ts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldEmails } from '@/lib/email';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Only cleanup old emails - no processing needed anymore
    const cleanedUp = await cleanupOldEmails(30);

    return NextResponse.json({
      success: true,
      message: 'Email cron is deprecated - emails are now sent directly via Resend',
      cleanedUp,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to cleanup email queue',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
