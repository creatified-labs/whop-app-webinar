import { headers } from 'next/headers';
import { Users, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import { Card, Heading, Text, Callout } from '@whop/react/components';
import { Sparkles } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getCompanyByWhopId } from '@/lib/data/companies';
import {
  getCompanyStats,
  getRegistrationTrends,
  getWebinarPerformance,
  getTrafficSources,
  type DateRange,
} from '@/lib/data/analytics';
import { StatsCard, StatsGrid } from '@/components/dashboard/stats-card';
import { DateRangeFilter } from '@/components/dashboard/date-range-filter';
import { AnalyticsChart } from '@/components/dashboard/analytics-chart';
import { WebinarPerformanceTable } from '@/components/dashboard/webinar-performance-table';
import { TrafficSources } from '@/components/dashboard/traffic-sources';

interface AnalyticsPageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ range?: DateRange }>;
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { companyId: whopCompanyId } = await params;
  const { range = '30d' } = await searchParams;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get company from our database
  const company = await getCompanyByWhopId(whopCompanyId);
  if (!company) {
    return (
      <div className="p-6">
        <Callout.Root color="orange" size="2">
          <Callout.Icon>
            <Sparkles className="h-4 w-4" />
          </Callout.Icon>
          <Callout.Text>
            Setting up your workspace. Please refresh the page to sync your company data.
          </Callout.Text>
        </Callout.Root>
      </div>
    );
  }

  // Fetch all analytics data in parallel
  const [stats, trends, performance, sources] = await Promise.all([
    getCompanyStats(company.id, range),
    getRegistrationTrends(company.id, range),
    getWebinarPerformance(company.id, { dateRange: range, limit: 10 }),
    getTrafficSources(company.id, range),
  ]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Heading size="6" weight="bold">
            Analytics
          </Heading>
          <Text size="2" color="gray" className="mt-1">
            Track your webinar performance and engagement
          </Text>
        </div>
        <DateRangeFilter
          currentRange={range}
          basePath={`/dashboard/${whopCompanyId}/analytics`}
        />
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <StatsGrid>
          <StatsCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={Users}
            description="Across all webinars"
            color="accent"
          />
          <StatsCard
            title="Total Attendees"
            value={stats.totalAttendees}
            icon={UserCheck}
            description="Actually joined"
            color="green"
          />
          <StatsCard
            title="Avg. Attendance Rate"
            value={stats.avgAttendanceRate}
            icon={TrendingUp}
            description={`${stats.avgAttendanceRate}% of registrants`}
            color="orange"
          />
          <StatsCard
            title="Total Webinars"
            value={stats.totalWebinars}
            icon={Calendar}
            description="In selected period"
            color="gray"
          />
        </StatsGrid>
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalyticsChart
            data={trends}
            title="Registration Trends"
            description="New registrations over time"
          />
        </div>
        <div>
          <TrafficSources sources={sources} />
        </div>
      </div>

      {/* Performance Table */}
      <div>
        <WebinarPerformanceTable webinars={performance} companyId={whopCompanyId} />
      </div>
    </div>
  );
}
