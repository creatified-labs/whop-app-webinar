import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';
import { Button } from '@whop/react/components';
import { getWebinarPublicView } from '@/lib/data/webinars';
import { AddToCalendar } from '@/components/funnel/add-to-calendar';
import { formatWebinarDate } from '@/lib/utils/date';

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
    title: `Registered for ${webinar.title}`,
    description: `You're registered for ${webinar.title}`,
  };
}

/**
 * Registration Success Page
 * Confirmation after successful registration
 */
export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { email } = await searchParams;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="space-y-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">You're Registered!</h1>
          <p className="text-gray-600">
            We've saved your spot for <strong>{webinar.title}</strong>
          </p>
          {email && (
            <p className="text-sm text-gray-500">
              Confirmation sent to <strong>{email}</strong>
            </p>
          )}
        </div>

        {/* Webinar Details */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-left">
          <h2 className="font-semibold text-gray-900">{webinar.title}</h2>
          <p className="mt-1 text-gray-600">
            {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
          </p>
        </div>

        {/* Add to Calendar */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-left">
          <AddToCalendar
            title={webinar.title}
            description={webinar.description}
            startTime={webinar.scheduled_at}
            durationMinutes={webinar.duration_minutes}
            timezone={webinar.timezone}
          />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {webinar.status === 'live' && (
            <Link href={`/webinar/${slug}/watch?email=${encodeURIComponent(email || '')}`}>
              <Button variant="solid" className="w-full">
                Join Live Now
              </Button>
            </Link>
          )}
          <Link href={`/webinar/${slug}`}>
            <Button variant="soft" className="w-full">
              Back to Webinar Page
            </Button>
          </Link>
        </div>

        {/* Reminder */}
        <p className="text-sm text-gray-500">
          You'll receive a reminder email before the webinar starts.
        </p>
      </div>
    </main>
  );
}
