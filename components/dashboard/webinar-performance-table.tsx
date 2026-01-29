import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, Heading, Text, Badge } from '@whop/react/components';
import type { WebinarPerformance } from '@/lib/data/analytics';
import type { WebinarStatus } from '@/types/database';

interface WebinarPerformanceTableProps {
  webinars: WebinarPerformance[];
  companyId: string;
}

const statusConfig: Record<WebinarStatus, { color: 'gray' | 'blue' | 'red' | 'green' | 'orange'; label: string }> = {
  draft: { color: 'gray', label: 'Draft' },
  scheduled: { color: 'blue', label: 'Scheduled' },
  live: { color: 'red', label: 'Live' },
  ended: { color: 'green', label: 'Ended' },
  cancelled: { color: 'orange', label: 'Cancelled' },
};

export function WebinarPerformanceTable({ webinars, companyId }: WebinarPerformanceTableProps) {
  if (webinars.length === 0) {
    return (
      <Card size="2">
        <Heading size="4" weight="semi-bold" className="mb-1">
          Webinar Performance
        </Heading>
        <Text size="2" color="gray" className="mb-4">
          Performance metrics for each webinar
        </Text>
        <div className="flex h-32 items-center justify-center">
          <Text size="2" color="gray">
            No webinars found for this period
          </Text>
        </div>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card size="2" className="overflow-hidden">
      <div className="mb-4">
        <Heading size="4" weight="semi-bold">
          Webinar Performance
        </Heading>
        <Text size="2" color="gray" className="mt-0.5">
          Performance metrics for each webinar
        </Text>
      </div>

      <div className="-mx-4 -mb-4 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-a4 bg-gray-a2">
              <th className="px-4 py-3 text-left text-1 font-semibold uppercase tracking-wider text-gray-11">
                Webinar
              </th>
              <th className="px-4 py-3 text-left text-1 font-semibold uppercase tracking-wider text-gray-11">
                Status
              </th>
              <th className="px-4 py-3 text-right text-1 font-semibold uppercase tracking-wider text-gray-11">
                Registrations
              </th>
              <th className="px-4 py-3 text-right text-1 font-semibold uppercase tracking-wider text-gray-11">
                Attendees
              </th>
              <th className="px-4 py-3 text-right text-1 font-semibold uppercase tracking-wider text-gray-11">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-a3">
            {webinars.map((webinar) => {
              const status = statusConfig[webinar.status as WebinarStatus];

              return (
                <tr key={webinar.id} className="transition-colors hover:bg-gray-a2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${companyId}/webinars/${webinar.id}`}
                      className="group flex items-center gap-2"
                    >
                      <div>
                        <Text size="2" weight="medium" className="group-hover:text-accent-11 transition-colors">
                          {webinar.title}
                        </Text>
                        <Text size="1" color="gray">
                          {formatDate(webinar.scheduledAt)}
                        </Text>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-gray-8 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge size="1" color={status.color}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Text size="2" weight="medium">
                      {webinar.registrations}
                    </Text>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Text size="2" weight="medium">
                      {webinar.attendees}
                    </Text>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Text
                      size="2"
                      weight="medium"
                      color={webinar.attendanceRate >= 50 ? 'green' : webinar.attendanceRate >= 25 ? 'orange' : 'gray'}
                    >
                      {webinar.attendanceRate}%
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
