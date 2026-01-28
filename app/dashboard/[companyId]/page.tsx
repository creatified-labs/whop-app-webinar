import Link from 'next/link';
import { headers } from 'next/headers';
import { Plus, Eye, Users, Radio, Calendar } from 'lucide-react';
import { Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getCompanyByWhopId } from '@/lib/data/companies';
import { getCompanyWebinars } from '@/lib/data/webinars';
import { StatsCard, StatsGrid } from '@/components/dashboard/stats-card';
import { WebinarList } from '@/components/dashboard/webinar-card';

interface DashboardPageProps {
  params: Promise<{ companyId: string }>;
}

/**
 * Dashboard Overview Page
 * Card grid showing stats and webinars
 */
export default async function DashboardPage({ params }: DashboardPageProps) {
  const { companyId: whopCompanyId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get company from our database
  const company = await getCompanyByWhopId(whopCompanyId);
  if (!company) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-800">
            Company not found. Please refresh the page to sync your data.
          </p>
        </div>
      </div>
    );
  }

  // Get webinars with registration counts
  const { webinars } = await getCompanyWebinars(company.id);

  // Calculate stats
  const totalWebinars = webinars.length;
  const liveWebinars = webinars.filter((w) => w.status === 'live').length;
  const scheduledWebinars = webinars.filter((w) => w.status === 'scheduled').length;

  // For now, we'll show placeholder stats - real analytics will come in a later phase
  const totalRegistrations = 0; // TODO: Aggregate from all webinars
  const totalViews = 0; // TODO: From analytics

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">
            Manage your webinars and view performance
          </p>
        </div>
        <Link href={`/dashboard/${whopCompanyId}/webinars/new`}>
          <Button variant="solid">
            <Plus className="mr-2 h-4 w-4" />
            Create Webinar
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <StatsGrid>
          <StatsCard
            title="Total Webinars"
            value={totalWebinars}
            icon={Calendar}
            description={`${scheduledWebinars} scheduled`}
          />
          <StatsCard
            title="Live Now"
            value={liveWebinars}
            icon={Radio}
          />
          <StatsCard
            title="Total Registrations"
            value={totalRegistrations}
            icon={Users}
            description="Across all webinars"
          />
          <StatsCard
            title="Total Views"
            value={totalViews}
            icon={Eye}
            description="Live + replay"
          />
        </StatsGrid>
      </div>

      {/* Webinar List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Webinars</h2>
        </div>
        <WebinarList
          webinars={webinars.map((w) => ({ ...w, registration_count: 0 }))}
          companyId={whopCompanyId}
        />
      </div>
    </div>
  );
}
