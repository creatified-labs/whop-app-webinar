import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getWebinarPublicView } from '@/lib/data/webinars';
import { WebinarHero } from '@/components/funnel/webinar-hero';
import { HostList } from '@/components/funnel/host-card';
import { SocialProof } from '@/components/funnel/social-proof';
import { CountdownBanner } from '@/components/funnel/countdown-timer';
import { InlineRegistrationForm } from '@/components/funnel/registration-form';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    return { title: 'Webinar Not Found' };
  }

  return {
    title: webinar.title,
    description: webinar.description || `Join ${webinar.title}`,
    openGraph: {
      title: webinar.title,
      description: webinar.description || `Join ${webinar.title}`,
      images: webinar.cover_image_url ? [webinar.cover_image_url] : [],
    },
  };
}

/**
 * Webinar Landing Page
 * Public page for webinar registration
 */
export default async function WebinarLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  const isLive = webinar.status === 'live';
  const isEnded = webinar.status === 'ended';

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Hero Section */}
        <WebinarHero webinar={webinar} />

        {/* Countdown or Status */}
        {!isLive && !isEnded && (
          <CountdownBanner targetDate={webinar.scheduled_at} />
        )}

        {isLive && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-center">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
              <span className="font-semibold text-green-700">Live Now</span>
            </span>
          </div>
        )}

        {isEnded && webinar.cta_url && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 text-center">
            <p className="text-blue-700">
              This webinar has ended.{' '}
              <a href={webinar.cta_url} className="font-semibold underline">
                Watch the replay
              </a>
            </p>
          </div>
        )}

        {/* Registration Form */}
        {!isEnded && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <InlineRegistrationForm slug={slug} ctaText={webinar.cta_text} />
          </div>
        )}

        {/* Description */}
        {webinar.description && (
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap text-gray-600">{webinar.description}</p>
          </div>
        )}

        {/* Hosts */}
        {webinar.show_host_info && webinar.hosts.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <HostList hosts={webinar.hosts} />
          </div>
        )}

        {/* Social Proof */}
        <SocialProof registrationCount={webinar.registration_count} />
      </div>
    </main>
  );
}
