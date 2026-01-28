import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getWebinarPublicView } from '@/lib/data/webinars';
import { getRegistrationByEmail } from '@/lib/data/registrations';
import { WatchPageClient } from './watch-client';

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

  // Determine video URL
  const videoUrl = webinar.status === 'ended'
    ? (webinar.cta_url || '') // Use replay/CTA URL for ended webinars
    : ''; // Video URL will come from webinar.video_url (not in public view)

  return (
    <WatchPageClient
      webinar={webinar}
      registration={registration}
      videoUrl={videoUrl}
    />
  );
}
