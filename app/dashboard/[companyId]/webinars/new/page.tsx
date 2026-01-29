import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Heading, Text } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { WebinarForm } from '@/components/dashboard/webinar-form';

interface NewWebinarPageProps {
  params: Promise<{ companyId: string }>;
}

/**
 * Create New Webinar Page
 * Modern page with form for creating a new webinar
 */
export default async function NewWebinarPage({ params }: NewWebinarPageProps) {
  const { companyId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  return (
    <div className="p-6">
      {/* Back Link */}
      <Link
        href={`/dashboard/${companyId}`}
        className="mb-6 inline-flex items-center gap-2 text-2 font-medium text-gray-11 transition-colors hover:text-gray-12"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-3 bg-accent-9 p-3 shadow-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <Heading size="6" weight="bold">
              Create New Webinar
            </Heading>
            <Text size="2" color="gray">
              Fill in the details below to create your webinar
            </Text>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-4xl">
        <WebinarForm companyId={companyId} mode="create" />
      </div>
    </div>
  );
}
