import { headers } from 'next/headers';
import { Callout, Heading, Text } from '@whop/react/components';
import { Sparkles } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getCompanyByWhopId, getCompanyMembersWithUsers, checkCompanyRole } from '@/lib/data/companies';
import { getOrCreateUser } from '@/lib/data/users';
import { getEngagementConfig } from '@/lib/data/engagement';
import { CompanyProfileForm } from '@/components/dashboard/company-profile-form';
import { TeamMembersList } from '@/components/dashboard/team-members-list';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { DefaultWebinarSettings } from '@/components/dashboard/default-webinar-settings';
import { EngagementConfigForm } from '@/components/dashboard/engagement-config';

interface SettingsPageProps {
  params: Promise<{ companyId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { companyId: whopCompanyId } = await params;

  // Verify user
  const headersList = await headers();
  const { userId: whopUserId } = await whopsdk.verifyUserToken(headersList);

  // Get user data from Whop
  const whopUser = await whopsdk.users.retrieve(whopUserId);
  const dbUser = await getOrCreateUser({
    id: whopUser.id,
    email: null,
    name: whopUser.name ?? null,
    username: whopUser.username ?? null,
    profile_pic_url: whopUser.profile_picture?.url ?? null,
  });

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

  // Get members, engagement config, and check if current user is owner
  const [members, isOwner, engagementConfig] = await Promise.all([
    getCompanyMembersWithUsers(company.id),
    checkCompanyRole(company.id, dbUser.id, 'owner'),
    getEngagementConfig(company.id),
  ]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Heading size="6" weight="bold">
          Settings
        </Heading>
        <Text size="2" color="gray" className="mt-1">
          Manage your workspace settings and preferences
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Company Profile */}
          <CompanyProfileForm company={company} whopCompanyId={whopCompanyId} />

          {/* Team Members */}
          <TeamMembersList
            members={members}
            currentUserId={dbUser.id}
            isOwner={isOwner}
            whopCompanyId={whopCompanyId}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <NotificationSettings whopCompanyId={whopCompanyId} />

          {/* Default Webinar Settings */}
          <DefaultWebinarSettings whopCompanyId={whopCompanyId} />

          {/* Engagement Scoring Config */}
          <EngagementConfigForm
            companyId={company.id}
            initialConfig={engagementConfig || undefined}
          />
        </div>
      </div>
    </div>
  );
}
