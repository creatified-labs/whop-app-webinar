import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Play,
  Square,
  Send,
  Users,
  BarChart3,
  Gift,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarWithDetails } from '@/lib/data/webinars';
import { getRegistrationCount } from '@/lib/data/registrations';
import { formatWebinarDate, formatDuration } from '@/lib/utils/date';
import { WebinarForm } from '@/components/dashboard/webinar-form';

interface WebinarDetailPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

/**
 * Webinar Detail Page
 * Shows webinar details with edit form and quick actions
 */
export default async function WebinarDetailPage({ params }: WebinarDetailPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarWithDetails(webinarId);
  if (!webinar) {
    notFound();
  }

  // Get registration count
  const registrationCount = await getRegistrationCount(webinarId);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-red-100 text-red-700',
    ended: 'bg-green-100 text-green-700',
    cancelled: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{webinar.title}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[webinar.status]
                }`}
              >
                {webinar.status.charAt(0).toUpperCase() + webinar.status.slice(1)}
              </span>
            </div>
            <p className="mt-1 text-gray-500">
              {formatWebinarDate(webinar.scheduled_at, webinar.timezone)} &bull;{' '}
              {formatDuration(webinar.duration_minutes)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {webinar.status === 'draft' && (
              <form action={`/api/webinar/${webinarId}/publish`} method="POST">
                <Button type="submit" variant="solid">
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              </form>
            )}
            {webinar.status === 'scheduled' && (
              <form action={`/api/webinar/${webinarId}/go-live`} method="POST">
                <Button type="submit" variant="solid">
                  <Play className="mr-2 h-4 w-4" />
                  Go Live
                </Button>
              </form>
            )}
            {webinar.status === 'live' && (
              <form action={`/api/webinar/${webinarId}/end`} method="POST">
                <Button type="submit" variant="soft">
                  <Square className="mr-2 h-4 w-4" />
                  End Webinar
                </Button>
              </form>
            )}
            {webinar.status !== 'draft' && (
              <Link href={`/webinar/${webinar.slug}`} target="_blank">
                <Button variant="soft">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Page
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickLink
          href={`/dashboard/${companyId}/webinars/${webinarId}/registrations`}
          icon={Users}
          label="Registrations"
          count={registrationCount}
        />
        <QuickLink
          href={`/dashboard/${companyId}/webinars/${webinarId}/polls`}
          icon={BarChart3}
          label="Polls"
        />
        <QuickLink
          href={`/dashboard/${companyId}/webinars/${webinarId}/discounts`}
          icon={Gift}
          label="Discounts"
        />
        <QuickLink
          href={`/dashboard/${companyId}/webinars/${webinarId}/analytics`}
          icon={MessageCircle}
          label="Analytics"
        />
      </div>

      {/* Edit Form */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit Webinar</h2>
        <WebinarForm companyId={companyId} webinar={webinar} mode="edit" />
      </div>
    </div>
  );
}

interface QuickLinkProps {
  href: string;
  icon: typeof Users;
  label: string;
  count?: number;
}

function QuickLink({ href, icon: Icon, label, count }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="rounded-lg bg-blue-50 p-2">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {count !== undefined && (
          <p className="text-sm text-gray-500">{count} total</p>
        )}
      </div>
    </Link>
  );
}
