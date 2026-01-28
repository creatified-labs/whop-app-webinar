import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { getWebinarPublicView } from '@/lib/data/webinars';
import { RegistrationForm } from '@/components/funnel/registration-form';
import { formatWebinarDate } from '@/lib/utils/date';

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
    title: `Register for ${webinar.title}`,
    description: `Sign up for ${webinar.title}`,
  };
}

/**
 * Registration Page
 * Dedicated registration form page
 */
export default async function RegisterPage({ params }: PageProps) {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  if (webinar.status === 'ended') {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Registration Closed</h1>
          <p className="mt-2 text-gray-600">
            This webinar has ended and is no longer accepting registrations.
          </p>
          <Link
            href={`/webinar/${slug}`}
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to webinar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href={`/webinar/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register for Webinar</h1>
          <p className="mt-1 text-gray-600">{webinar.title}</p>
          <p className="mt-1 text-sm text-gray-500">
            {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <RegistrationForm slug={slug} ctaText={webinar.cta_text} />
        </div>

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-500">
          By registering, you agree to receive emails about this webinar.
          Your email will not be shared with third parties.
        </p>
      </div>
    </main>
  );
}
