import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Video,
  LayoutDashboard,
  Calendar,
  Settings,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { syncCompanyMembership } from '@/lib/data/companies';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}

/**
 * Dashboard Layout
 * Modern layout with sidebar navigation and company sync
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

  // Sync company membership to our database
  await syncCompanyMembership(
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
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Webinar Studio</span>
          </div>

          {/* Company Selector */}
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              {company.logo?.url ? (
                <img
                  src={company.logo.url}
                  alt={company.title}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-semibold text-gray-600">
                  {company.title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-900">
                  {company.title}
                </p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavItem href={`/dashboard/${companyId}`} icon={LayoutDashboard}>
              Dashboard
            </NavItem>
            <NavItem href={`/dashboard/${companyId}/webinars/new`} icon={Calendar}>
              Create Webinar
            </NavItem>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4">
            <NavItem href={`/dashboard/${companyId}/settings`} icon={Settings}>
              Settings
            </NavItem>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
            </button>

            {/* User */}
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 py-1.5 pl-1.5 pr-4">
              {user.profile_picture?.url ? (
                <img
                  src={user.profile_picture.url}
                  alt={user.name || user.username || 'User'}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 text-sm font-medium text-gray-600">
                  {(user.name || user.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.name || `@${user.username}`}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: typeof LayoutDashboard;
  children: React.ReactNode;
}

function NavItem({ href, icon: Icon, children }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
