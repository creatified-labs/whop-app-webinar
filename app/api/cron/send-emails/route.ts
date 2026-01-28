/**
 * Send Emails Cron Job
 * Processes the email queue and sends pending emails
 *
 * Run every minute via Vercel Cron:
 * vercel.json: { "crons": [{ "path": "/api/cron/send-emails", "schedule": "* * * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue, cleanupOldEmails } from '@/lib/email';

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
    // Process email queue
    const result = await processEmailQueue(50);

    // Cleanup old emails occasionally (1% chance per run)
    let cleanedUp = 0;
    if (Math.random() < 0.01) {
      cleanedUp = await cleanupOldEmails(30);
    }

    return NextResponse.json({
      success: true,
      ...result,
      cleanedUp,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process email queue',
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
