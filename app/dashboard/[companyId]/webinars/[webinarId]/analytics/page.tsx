import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, BarChart3, Users, Eye, Clock } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import { getRegistrationCount, getAttendeeCount } from '@/lib/data/registrations';
import { StatsCard, StatsGrid } from '@/components/dashboard/stats-card';

interface AnalyticsPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

/**
 * Analytics Page
 * View webinar performance metrics
 */
export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    notFound();
  }

  // Get stats
  const registrationCount = await getRegistrationCount(webinarId);
  const attendeeCount = await getAttendeeCount(webinarId);

  const attendanceRate = registrationCount > 0
    ? Math.round((attendeeCount / registrationCount) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-500">{webinar.title}</p>
      </div>

      {/* Stats */}
      <StatsGrid>
        <StatsCard
          title="Registrations"
          value={registrationCount}
          icon={Users}
        />
        <StatsCard
          title="Attendees"
          value={attendeeCount}
          icon={Eye}
        />
        <StatsCard
          title="Attendance Rate"
          value={attendanceRate}
          icon={BarChart3}
          description={`${attendanceRate}%`}
        />
        <StatsCard
          title="Duration"
          value={webinar.duration_minutes}
          icon={Clock}
          description="minutes"
        />
      </StatsGrid>

      {/* Coming Soon */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">More Analytics Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">
          Detailed engagement metrics, chat analytics, and more will be available in a future update.
        </p>
      </div>
    </div>
  );
}
