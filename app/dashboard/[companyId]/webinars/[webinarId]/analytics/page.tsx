import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft, BarChart3, Users, Eye, Clock, Trophy, Zap } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import { getRegistrationCount, getAttendeeCount } from '@/lib/data/registrations';
import { getWebinarEngagementStats } from '@/lib/data/engagement';
import { getWebinarWatchTimeStats } from '@/lib/data/watch-time';
import { getLeadScoreLeaderboard, getLeadScoreDistribution, getLeadScoreSummary } from '@/lib/data/lead-scoring';
import { StatsCard, StatsGrid } from '@/components/dashboard/stats-card';
import { LeadScoreTable } from '@/components/dashboard/lead-score-table';

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
  const [
    registrationCount,
    attendeeCount,
    engagementStats,
    watchTimeStats,
    leaderboard,
    distribution,
    scoreSummary,
  ] = await Promise.all([
    getRegistrationCount(webinarId),
    getAttendeeCount(webinarId),
    getWebinarEngagementStats(webinarId),
    getWebinarWatchTimeStats(webinarId),
    getLeadScoreLeaderboard(webinarId, { limit: 20 }),
    getLeadScoreDistribution(webinarId),
    getLeadScoreSummary(webinarId),
  ]);

  const attendanceRate = registrationCount > 0
    ? Math.round((attendeeCount / registrationCount) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-11 hover:text-gray-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>
        <h1 className="text-2xl font-bold text-gray-12">Analytics</h1>
        <p className="mt-1 text-gray-11">{webinar.title}</p>
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

      {/* Engagement Stats */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-12">Engagement</h2>
        <StatsGrid>
          <StatsCard
            title="Total Engagement Events"
            value={engagementStats.totalEvents}
            icon={Zap}
          />
          <StatsCard
            title="Total Points Earned"
            value={engagementStats.totalPoints}
            icon={Trophy}
          />
          <StatsCard
            title="Unique Participants"
            value={engagementStats.uniqueParticipants}
            icon={Users}
          />
          <StatsCard
            title="Avg Points/Participant"
            value={engagementStats.avgPointsPerParticipant}
            icon={BarChart3}
          />
        </StatsGrid>
      </div>

      {/* Watch Time Stats */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-12">Watch Time</h2>
        <StatsGrid>
          <StatsCard
            title="Watch Sessions"
            value={watchTimeStats.totalSessions}
            icon={Eye}
          />
          <StatsCard
            title="Unique Viewers"
            value={watchTimeStats.uniqueViewers}
            icon={Users}
          />
          <StatsCard
            title="Completion Rate"
            value={watchTimeStats.completionRate}
            icon={BarChart3}
            description="%"
          />
          <StatsCard
            title="Avg Watch Time"
            value={Math.round(watchTimeStats.avgWatchSeconds / 60)}
            icon={Clock}
            description="min"
          />
        </StatsGrid>

        {/* Milestone Breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[25, 50, 75, 100].map((milestone) => (
            <div key={milestone} className="rounded-lg border border-gray-a4 bg-gray-a2 p-4 text-center">
              <div className="text-2xl font-bold text-gray-12">
                {watchTimeStats.milestoneBreakdown[milestone] || 0}
              </div>
              <div className="text-sm text-gray-11">{milestone}% Milestone</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Scores */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-12">Lead Scores</h2>
        <LeadScoreTable
          webinarId={webinarId}
          leaderboard={leaderboard}
          distribution={distribution}
          summary={scoreSummary}
        />
      </div>
    </div>
  );
}
