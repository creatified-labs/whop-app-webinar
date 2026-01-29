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
  Clock,
  Calendar,
  Copy,
} from 'lucide-react';
import { Card, Heading, Text, Badge, Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarWithDetails } from '@/lib/data/webinars';
import { getRegistrationCount } from '@/lib/data/registrations';
import { formatWebinarDate, formatDuration } from '@/lib/utils/date';
import { WebinarForm } from '@/components/dashboard/webinar-form';
import type { WebinarStatus } from '@/types/database';

interface WebinarDetailPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

const statusConfig: Record<WebinarStatus, { color: 'gray' | 'blue' | 'red' | 'green' | 'orange'; label: string; dot?: boolean }> = {
  draft: { color: 'gray', label: 'Draft' },
  scheduled: { color: 'blue', label: 'Scheduled' },
  live: { color: 'red', label: 'Live', dot: true },
  ended: { color: 'green', label: 'Ended' },
  cancelled: { color: 'orange', label: 'Cancelled' },
};

/**
 * Webinar Detail Page
 * Modern design with status actions and quick links
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

  const status = statusConfig[webinar.status];

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

      {/* Header Card */}
      <Card size="2" className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Heading size="5" weight="bold">
                {webinar.title}
              </Heading>
              <Badge size="1" color={status.color} variant="solid">
                {status.dot && (
                  <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                )}
                {status.label}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Text size="2" color="gray" className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
              </Text>
              <Text size="2" color="gray" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(webinar.duration_minutes)}
              </Text>
              <Text size="2" color="gray" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {registrationCount} registered
              </Text>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {webinar.status === 'draft' && (
              <Button size="2" variant="solid">
                <Send className="h-4 w-4" />
                Publish
              </Button>
            )}
            {webinar.status === 'scheduled' && (
              <Button size="2" variant="solid" color="green">
                <Play className="h-4 w-4" />
                Go Live
              </Button>
            )}
            {webinar.status === 'live' && (
              <Button size="2" variant="soft" color="gray">
                <Square className="h-4 w-4" />
                End Webinar
              </Button>
            )}
            {webinar.status !== 'draft' && (
              <Link href={`/webinar/${webinar.slug}`} target="_blank">
                <Button size="2" variant="soft" color="gray">
                  <ExternalLink className="h-4 w-4" />
                  View Page
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Link URL */}
        {webinar.status !== 'draft' && (
          <div className="mt-4 flex items-center gap-3 rounded-2 bg-gray-a2 px-4 py-3">
            <Text size="2" color="gray">
              Public URL:
            </Text>
            <code className="flex-1 truncate rounded-1 bg-gray-a3 px-3 py-1.5 text-2 text-gray-12">
              {typeof window !== 'undefined' ? window.location.origin : ''}/webinar/{webinar.slug}
            </code>
            <button
              type="button"
              className="rounded-2 p-2 text-gray-11 transition-colors hover:bg-gray-a3 hover:text-gray-12"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuickLinkCard
          href={`/dashboard/${companyId}/webinars/${webinarId}/registrations`}
          icon={Users}
          label="Registrations"
          count={registrationCount}
          color="blue"
        />
        <QuickLinkCard
          href={`/dashboard/${companyId}/webinars/${webinarId}/polls`}
          icon={BarChart3}
          label="Polls"
          color="purple"
        />
        <QuickLinkCard
          href={`/dashboard/${companyId}/webinars/${webinarId}/discounts`}
          icon={Gift}
          label="Discounts"
          color="orange"
        />
        <QuickLinkCard
          href={`/dashboard/${companyId}/webinars/${webinarId}/analytics`}
          icon={MessageCircle}
          label="Analytics"
          color="green"
        />
      </div>

      {/* Edit Form */}
      <div>
        <div className="mb-6">
          <Heading size="4" weight="semi-bold">
            Edit Webinar
          </Heading>
          <Text size="2" color="gray">
            Update your webinar settings and details
          </Text>
        </div>
        <WebinarForm companyId={companyId} webinar={webinar} mode="edit" />
      </div>
    </div>
  );
}

interface QuickLinkCardProps {
  href: string;
  icon: typeof Users;
  label: string;
  count?: number;
  color: 'blue' | 'purple' | 'orange' | 'green';
}

const colorStyles = {
  blue: 'bg-blue-a3 text-blue-11',
  purple: 'bg-purple-a3 text-purple-11',
  orange: 'bg-orange-a3 text-orange-11',
  green: 'bg-green-a3 text-green-11',
};

function QuickLinkCard({ href, icon: Icon, label, count, color }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <Card size="2" className="group transition-shadow hover:shadow-3">
        <div className="flex items-center gap-4">
          <div className={`rounded-2 p-3 ${colorStyles[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-1 text-gray-11">
              {label}
            </span>
            {count !== undefined && (
              <span className="text-4 font-bold text-gray-12 transition-colors group-hover:text-accent-11">
                {count}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
