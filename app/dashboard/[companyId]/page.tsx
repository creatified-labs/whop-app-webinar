import Link from 'next/link';
import { headers } from 'next/headers';
import { Eye, Users, Radio, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Card, Heading, Text, Callout } from '@whop/react/components';
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
 * Modern dashboard with Frosted UI components
 */
export default async function DashboardPage({ params }: DashboardPageProps) {
  const { companyId: whopCompanyId } = await params;

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

  // Get webinars with registration counts
  const { webinars } = await getCompanyWebinars(company.id);

  // Calculate stats
  const totalWebinars = webinars.length;
  const liveWebinars = webinars.filter((w) => w.status === 'live').length;
  const scheduledWebinars = webinars.filter((w) => w.status === 'scheduled').length;

  // Placeholder stats
  const totalRegistrations = 0;
  const totalViews = 0;

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <Heading size="6" weight="bold">
          Welcome back
        </Heading>
        <Text size="2" color="gray" className="mt-1">
          Here&apos;s what&apos;s happening with your webinars
        </Text>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <StatsGrid>
          <StatsCard
            title="Total Webinars"
            value={totalWebinars}
            icon={Calendar}
            description={`${scheduledWebinars} scheduled`}
            color="accent"
          />
          <StatsCard
            title="Live Now"
            value={liveWebinars}
            icon={Radio}
            color={liveWebinars > 0 ? 'red' : 'gray'}
          />
          <StatsCard
            title="Total Registrations"
            value={totalRegistrations}
            icon={Users}
            description="Across all webinars"
            color="green"
          />
          <StatsCard
            title="Total Views"
            value={totalViews}
            icon={Eye}
            description="Live + replay"
            color="orange"
          />
        </StatsGrid>
      </div>

      {/* Quick Actions */}
      {webinars.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickActionCard
              title="View Analytics"
              description="Track engagement and conversions"
              icon={TrendingUp}
              href={`/dashboard/${whopCompanyId}/analytics`}
              color="purple"
            />
            <QuickActionCard
              title="Manage Registrations"
              description="View and export your audience"
              icon={Users}
              href={`/dashboard/${whopCompanyId}/registrations`}
              color="green"
            />
            <QuickActionCard
              title="Upcoming Schedule"
              description="See what's coming up next"
              icon={Calendar}
              href={`/dashboard/${whopCompanyId}/schedule`}
              color="orange"
            />
          </div>
        </div>
      )}

      {/* Webinar List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Heading size="4" weight="semi-bold">
              Your Webinars
            </Heading>
            <Text size="2" color="gray">
              Manage and monitor all your webinars
            </Text>
          </div>
          {webinars.length > 0 && (
            <Link
              href={`/dashboard/${whopCompanyId}/webinars`}
              className="text-2 font-medium text-accent-11 hover:text-accent-12"
            >
              View all
            </Link>
          )}
        </div>
        <WebinarList
          webinars={webinars.slice(0, 6).map((w) => ({ ...w, registration_count: 0 }))}
          companyId={whopCompanyId}
        />
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  href: string;
  color: 'purple' | 'green' | 'orange';
}

const colorStyles = {
  purple: 'bg-purple-a3 text-purple-11',
  green: 'bg-green-a3 text-green-11',
  orange: 'bg-orange-a3 text-orange-11',
};

function QuickActionCard({ title, description, icon: Icon, href, color }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card size="2" className="group transition-shadow hover:shadow-3">
        <div className="flex items-start gap-4">
          <div className={`rounded-3 p-2.5 ${colorStyles[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <Heading size="3" weight="semi-bold" className="transition-colors group-hover:text-accent-11">
              {title}
            </Heading>
            <Text size="2" color="gray" className="mt-0.5">
              {description}
            </Text>
          </div>
        </div>
      </Card>
    </Link>
  );
}
