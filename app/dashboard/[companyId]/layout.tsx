import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Video, Bell, Plus } from 'lucide-react';
import { Avatar, IconButton, Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { syncCompanyMembership } from '@/lib/data/companies';
import { DashboardNav, MobileDashboardNav } from '@/components/dashboard/dashboard-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

/**
 * Dashboard Layout
 * Clean layout with Frosted UI components - dark mode compatible
 */
export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { companyId } = await params;

  // Verify user authentication
  let userId: string;
  try {
    const result = await whopsdk.verifyUserToken(await headers());
    userId = result.userId;
  } catch {
    redirect('/');
  }

  // Fetch company and user data from Whop
  const [company, user] = await Promise.all([
    whopsdk.companies.retrieve(companyId),
    whopsdk.users.retrieve(userId),
  ]);

  // Sync company membership to our database (non-blocking for faster page loads)
  // This runs in the background - sync errors won't block page render
  syncCompanyMembership(
    company.id,
    user.id,
    {
      id: company.id,
      title: company.title,
      image_url: company.logo?.url ?? null,
    },
    {
      id: user.id,
      email: null,
      name: user.name ?? null,
      username: user.username ?? null,
      profile_pic_url: user.profile_picture?.url ?? null,
    },
    'owner'
  ).catch(console.error);

  return (
    <div className="min-h-screen bg-gray-1">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy shadow-glass-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo */}
            <Link href={`/dashboard/${companyId}`} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2 bg-accent-9 shadow-2">
                <Video className="h-5 w-5 text-white" />
              </div>
              <span className="hidden font-semibold text-gray-12 sm:block">
                Webinar Studio
              </span>
            </Link>

            {/* Center: Navigation */}
            <DashboardNav companyId={companyId} />

            {/* Right: Actions & User */}
            <div className="flex items-center gap-2">
              {/* Create Button */}
              <Link href={`/dashboard/${companyId}/webinars/new`} className="hidden sm:block">
                <Button size="2" variant="solid">
                  <Plus className="h-4 w-4" />
                  New Webinar
                </Button>
              </Link>

              {/* Mobile Create */}
              <Link href={`/dashboard/${companyId}/webinars/new`} className="sm:hidden">
                <IconButton size="2" variant="solid">
                  <Plus className="h-4 w-4" />
                </IconButton>
              </Link>

              {/* Notifications */}
              <div className="relative">
                <IconButton size="2" variant="ghost" color="gray">
                  <Bell className="h-4 w-4" />
                </IconButton>
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-9 ring-2 ring-gray-1" />
              </div>

              {/* User Avatar */}
              <Avatar
                size="2"
                src={user.profile_picture?.url || undefined}
                fallback={(user.name || user.username || 'U')[0].toUpperCase()}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="border-t border-gray-a3/30 glass-light px-4 py-2 md:hidden">
          <MobileDashboardNav companyId={companyId} />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
