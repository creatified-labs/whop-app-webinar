import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { whopsdk } from '@/lib/whop-sdk';
import { getWebinarById } from '@/lib/data/webinars';
import { getWebinarPollsWithResults, createPoll, updatePollStatus, deletePoll } from '@/lib/data/polls';
import { PollManager } from '@/components/dashboard/poll-manager';
import type { PollStatus } from '@/types/database';

interface PollsPageProps {
  params: Promise<{ companyId: string; webinarId: string }>;
}

/**
 * Polls Page
 * Create and manage webinar polls
 */
export default async function PollsPage({ params }: PollsPageProps) {
  const { companyId, webinarId } = await params;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get webinar
  const webinar = await getWebinarById(webinarId);
  if (!webinar) {
    notFound();
  }

  // Get polls
  const polls = await getWebinarPollsWithResults(webinarId);

  // Server actions
  async function handleCreatePoll(data: {
    question: string;
    options: { id: string; text: string }[];
    allow_multiple: boolean;
    show_results_live: boolean;
  }) {
    'use server';
    await createPoll(webinarId, {
      question: data.question,
      options: data.options,
      allow_multiple: data.allow_multiple,
      show_results_live: data.show_results_live,
    });
  }

  async function handleUpdatePollStatus(pollId: string, status: PollStatus) {
    'use server';
    await updatePollStatus(pollId, status);
  }

  async function handleDeletePoll(pollId: string) {
    'use server';
    await deletePoll(pollId);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/${companyId}/webinars/${webinarId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Webinar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
        <p className="mt-1 text-gray-500">
          {webinar.title} &bull; {polls.length} polls
        </p>
      </div>

      {/* Poll Manager */}
      <PollManager
        polls={polls}
        webinarId={webinarId}
        onCreatePoll={handleCreatePoll}
        onUpdatePollStatus={handleUpdatePollStatus}
        onDeletePoll={handleDeletePoll}
      />
    </div>
  );
}
