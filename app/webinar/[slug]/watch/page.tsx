import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getWebinarPublicView, getWebinarById } from '@/lib/data/webinars';
import { getRegistrationByEmail } from '@/lib/data/registrations';
import { canAccessWebinar } from '@/lib/data/payments';
import { WatchPageClient } from './watch-client';
import { PaymentGate } from '@/components/funnel/payment-gate';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    return { title: 'Webinar Not Found' };
  }

  return {
    title: `Watch: ${webinar.title}`,
    description: `Watch ${webinar.title}`,
  };
}

/**
 * Watch Page
 * Live/replay viewing page with split view layout
 */
export default async function WatchPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { email } = await searchParams;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  // Require email for access
  if (!email) {
    redirect(`/webinar/${slug}/register`);
  }

  // Verify registration
  const registration = await getRegistrationByEmail(webinar.id, email);
  if (!registration) {
    redirect(`/webinar/${slug}/register`);
  }

  // Check webinar status
  if (webinar.status === 'draft' || webinar.status === 'cancelled') {
    notFound();
  }

  // Check payment access for paid webinars
  const hasAccess = await canAccessWebinar(registration.id);
  if (!hasAccess) {
    // Get full webinar data for price display
    const fullWebinar = await getWebinarById(webinar.id);
    const priceCents = fullWebinar?.price_cents || 0;

    return (
      <PaymentGate
        webinarSlug={slug}
        registrationId={registration.id}
        webinarTitle={webinar.title}
        priceCents={priceCents}
        paymentStatus={registration.payment_status as 'pending' | 'not_required'}
      />
    );
  }

  // Determine video URL based on status
  let videoUrl = '';
  if (webinar.status === 'ended') {
    // Use replay URL for ended webinars, fall back to video_url
    videoUrl = webinar.replay_url || webinar.video_url || '';
  } else {
    videoUrl = webinar.video_url || '';
  }

  return (
    <WatchPageClient
      webinar={webinar}
      registration={registration}
      videoUrl={videoUrl}
    />
  );
}
