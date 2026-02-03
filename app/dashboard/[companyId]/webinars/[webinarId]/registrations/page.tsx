import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import { getWebinarRegistrations } from '@/lib/data/registrations';
import { RegistrationTable } from '@/components/dashboard/registration-table';

interface RegistrationsPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

/**
 * Registrations Page
 * View and manage webinar registrations
 */
export default async function RegistrationsPage({ params }: RegistrationsPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    notFound();
  }

  // Get registrations
  const { registrations } = await getWebinarRegistrations(webinarId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-11 hover:text-gray-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>
        <h1 className="text-2xl font-bold text-gray-12">Registrations</h1>
        <p className="mt-1 text-gray-11">
          {webinar.title} &bull; {registrations.length} registered
        </p>
      </div>

      {/* Table */}
      <RegistrationTable registrations={registrations} webinarId={webinarId} />
    </div>
  );
}
