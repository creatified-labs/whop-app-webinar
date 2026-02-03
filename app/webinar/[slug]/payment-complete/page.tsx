import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, Calendar, Clock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { getWebinarBySlug } from '@/lib/data/webinars';
import { getRegistrationById } from '@/lib/data/registrations';
import { formatInTimeZone } from 'date-fns-tz';

interface PaymentCompletePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ registration_id?: string }>;
}

export async function generateMetadata({ params }: PaymentCompletePageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarBySlug(slug);

  if (!webinar) {
    return { title: 'Payment Complete - Webinar Not Found' };
  }

  return {
    title: `Payment Complete - ${webinar.title}`,
    description: `Your registration for ${webinar.title} is confirmed`,
  };
}

/**
 * Payment Complete Page
 * Shown after successful Whop checkout
 */
export default async function PaymentCompletePage({ params, searchParams }: PaymentCompletePageProps) {
  const { slug } = await params;
  const { registration_id } = await searchParams;

  const webinar = await getWebinarBySlug(slug);
  if (!webinar) {
    notFound();
  }

  // Validate registration exists
  if (!registration_id) {
    redirect(`/webinar/${slug}`);
  }

  const registration = await getRegistrationById(registration_id);
  if (!registration || registration.webinar_id !== webinar.id) {
    redirect(`/webinar/${slug}`);
  }

  // Format the webinar date/time
  const formattedDate = formatInTimeZone(
    new Date(webinar.scheduled_at),
    webinar.timezone,
    'EEEE, MMMM d, yyyy'
  );
  const formattedTime = formatInTimeZone(
    new Date(webinar.scheduled_at),
    webinar.timezone,
    'h:mm a zzz'
  );

  // Check if payment is still pending (webhook may not have fired yet)
  const isPending = registration.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-funnel-bg-base">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-funnel-2xl bg-funnel-bg-card p-8 text-center ring-1 ring-funnel-border">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            {isPending ? (
              <div className="rounded-full bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="rounded-full bg-green-500/10 p-4 ring-1 ring-green-500/20">
                <Check className="h-12 w-12 text-green-500" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="mb-2 text-3xl font-bold text-funnel-text-primary">
            {isPending ? 'Processing Payment...' : 'Payment Successful!'}
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-funnel-text-secondary">
            {isPending
              ? 'Your payment is being processed. This page will update automatically.'
              : "You're all set! Check your email for confirmation details."}
          </p>

          {/* Webinar Details */}
          <div className="mb-8 rounded-funnel-xl bg-funnel-bg-elevated p-6 text-left">
            <h2 className="mb-4 text-lg font-semibold text-funnel-text-primary">
              {webinar.title}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-funnel-text-secondary">
                <Calendar className="h-5 w-5 text-funnel-text-muted" />
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-3 text-funnel-text-secondary">
                <Clock className="h-5 w-5 text-funnel-text-muted" />
                <span>
                  {formattedTime} ({webinar.duration_minutes} min)
                </span>
              </div>

              <div className="flex items-center gap-3 text-funnel-text-secondary">
                <Mail className="h-5 w-5 text-funnel-text-muted" />
                <span>{registration.email}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!isPending && (
              <Link
                href={`/webinar/${slug}/watch?email=${encodeURIComponent(registration.email)}`}
                className="funnel-shimmer group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
              >
                Access Webinar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            <Link
              href={`/webinar/${slug}`}
              className="block w-full rounded-funnel-xl bg-funnel-bg-elevated px-6 py-3 text-sm font-medium text-funnel-text-primary transition-colors hover:bg-funnel-bg-elevated/80"
            >
              View Webinar Page
            </Link>
          </div>

          {/* Pending Payment Message */}
          {isPending && (
            <div className="mt-6 rounded-funnel-lg bg-amber-500/10 p-4 text-left text-sm text-amber-600">
              <p className="font-medium">Payment Processing</p>
              <p className="mt-1">
                Your payment is being verified. This usually takes a few seconds. If this page
                doesn&apos;t update within a minute, please contact support.
              </p>
            </div>
          )}

          {/* Email Reminder */}
          {!isPending && (
            <p className="mt-6 text-sm text-funnel-text-muted">
              A confirmation email has been sent to {registration.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
