/**
 * Update Webinar Status Cron Job
 * Automatically updates webinar status based on schedule
 *
 * - scheduled -> live: When scheduled_at time is reached
 * - live -> ended: When scheduled_at + duration_minutes has passed
 *
 * Run every minute via Vercel Cron:
 * vercel.json: { "crons": [{ "path": "/api/cron/update-webinar-status", "schedule": "* * * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { queueReplayEmail } from '@/lib/email';

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

  const supabase = createAdminClient();
  const now = new Date();
  const results = {
    startedLive: 0,
    ended: 0,
    replayEmailsQueued: 0,
  };

  try {
    // 1. Start scheduled webinars that have reached their start time
    const { data: toStart, error: startError } = await supabase
      .from('webinars')
      .update({ status: 'live' })
      .eq('status', 'scheduled')
      .lte('scheduled_at', now.toISOString())
      .select('id, title');

    if (startError) {
      throw new Error(`Failed to start webinars: ${startError.message}`);
    }

    results.startedLive = toStart?.length || 0;

    // 2. End live webinars that have passed their duration
    // First, get webinars that should be ended
    const { data: liveWebinars, error: liveError } = await supabase
      .from('webinars')
      .select('id, title, scheduled_at, duration_minutes, replay_url, cta_text, cta_url, send_replay_email')
      .eq('status', 'live');

    if (liveError) {
      throw new Error(`Failed to get live webinars: ${liveError.message}`);
    }

    const toEnd: string[] = [];

    for (const webinar of liveWebinars || []) {
      const startTime = new Date(webinar.scheduled_at);
      const endTime = new Date(startTime.getTime() + webinar.duration_minutes * 60 * 1000);

      if (now >= endTime) {
        toEnd.push(webinar.id);

        // Queue replay emails if enabled and replay URL is set
        if (webinar.send_replay_email && webinar.replay_url) {
          try {
            await queueReplayEmailsForWebinar(webinar.id, webinar.title, webinar.replay_url, {
              ctaText: webinar.cta_text,
              ctaUrl: webinar.cta_url,
            });
            results.replayEmailsQueued++;
          } catch (err) {
            console.error(`Failed to queue replay emails for ${webinar.id}:`, err);
          }
        }
      }
    }

    // Update status to ended
    if (toEnd.length > 0) {
      const { error: endError } = await supabase
        .from('webinars')
        .update({ status: 'ended' })
        .in('id', toEnd);

      if (endError) {
        throw new Error(`Failed to end webinars: ${endError.message}`);
      }

      results.ended = toEnd.length;
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Webinar status cron error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update webinar statuses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Queue replay emails for all registrations of a webinar
 */
async function queueReplayEmailsForWebinar(
  webinarId: string,
  webinarTitle: string,
  replayUrl: string,
  options: { ctaText?: string | null; ctaUrl?: string | null }
): Promise<void> {
  const supabase = createAdminClient();

  // Get all registrations that haven't received replay email yet
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('id, email, name, attended, replay_sent')
    .eq('webinar_id', webinarId)
    .eq('replay_sent', false);

  if (error) {
    throw new Error(`Failed to get registrations: ${error.message}`);
  }

  // Get host name (first host)
  const { data: hosts } = await supabase
    .from('webinar_hosts')
    .select('name')
    .eq('webinar_id', webinarId)
    .order('display_order', { ascending: true })
    .limit(1);

  const hostName = hosts?.[0]?.name;

  // Queue emails for each registration
  for (const registration of registrations || []) {
    await queueReplayEmail({
      registrationId: registration.id,
      email: registration.email,
      name: registration.name,
      webinarTitle,
      replayUrl,
      attended: registration.attended,
      hostName,
      ctaText: options.ctaText || undefined,
      ctaUrl: options.ctaUrl || undefined,
    });

    // Mark replay as sent
    await supabase
      .from('registrations')
      .update({ replay_sent: true })
      .eq('id', registration.id);
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
