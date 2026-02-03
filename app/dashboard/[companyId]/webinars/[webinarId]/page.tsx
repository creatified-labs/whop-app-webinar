import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Users,
  BarChart3,
  Gift,
  MessageCircle,
  Clock,
  Calendar,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { Card, Heading, Text, Badge, Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarWithDetails } from '@/lib/data/webinars';
import { getRegistrationCount } from '@/lib/data/registrations';
import { formatWebinarDate, formatDuration } from '@/lib/utils/date';
import { WebinarForm } from '@/components/dashboard/webinar-form';
import { WebinarStatusActions } from '@/components/dashboard/webinar-status-actions';
import { CopyUrlButton, WebinarUrl } from '@/components/dashboard/copy-url-button';
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
            <WebinarStatusActions webinarId={webinar.id} status={webinar.status} />
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
            <WebinarUrl slug={webinar.slug} />
            <CopyUrlButton slug={webinar.slug} />
          </div>
        )}
      </Card>

      {/* Quick Links */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <QuickLinkCard
          href={`/dashboard/${companyId}/webinars/${webinarId}/broadcast`}
          icon={Radio}
          label="Broadcast"
          color="red"
        />
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
  color: 'blue' | 'purple' | 'orange' | 'green' | 'red';
}

const colorStyles = {
  blue: {
    icon: 'bg-blue-a3 text-blue-11 group-hover:bg-blue-a4',
    border: 'hover:border-blue-a6',
    text: 'group-hover:text-blue-11',
  },
  purple: {
    icon: 'bg-purple-a3 text-purple-11 group-hover:bg-purple-a4',
    border: 'hover:border-purple-a6',
    text: 'group-hover:text-purple-11',
  },
  orange: {
    icon: 'bg-orange-a3 text-orange-11 group-hover:bg-orange-a4',
    border: 'hover:border-orange-a6',
    text: 'group-hover:text-orange-11',
  },
  green: {
    icon: 'bg-green-a3 text-green-11 group-hover:bg-green-a4',
    border: 'hover:border-green-a6',
    text: 'group-hover:text-green-11',
  },
  red: {
    icon: 'bg-red-a3 text-red-11 group-hover:bg-red-a4',
    border: 'hover:border-red-a6',
    text: 'group-hover:text-red-11',
  },
};

function QuickLinkCard({ href, icon: Icon, label, count, color }: QuickLinkCardProps) {
  const styles = colorStyles[color];

  return (
    <Link href={href}>
      <div
        className={`group flex cursor-pointer items-center justify-between rounded-3 border-2 border-gray-a4 bg-gray-a2 p-4 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-a3 hover:shadow-3 active:scale-[0.98] ${styles.border}`}
      >
        <div className="flex items-center gap-4">
          <div className={`rounded-2 p-3 transition-colors ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-2 font-medium text-gray-12">
              {label}
            </span>
            {count !== undefined && (
              <span className={`text-1 text-gray-11 transition-colors ${styles.text}`}>
                {count} total
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 text-gray-8 transition-all group-hover:translate-x-0.5 ${styles.text}`} />
      </div>
    </Link>
  );
}
