import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { WebinarForm } from '@/components/dashboard/webinar-form';

interface NewWebinarPageProps {
  params: Promise<{ companyId: string }>;
}

/**
 * Create New Webinar Page
 */
export default async function NewWebinarPage({ params }: NewWebinarPageProps) {
  const { companyId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Webinar</h1>
        <p className="mt-1 text-gray-500">
          Fill in the details below to create a new webinar
        </p>
      </div>

      {/* Form */}
      <WebinarForm companyId={companyId} mode="create" />
    </div>
  );
}
