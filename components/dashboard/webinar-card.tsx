import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, MoreVertical, Edit, Trash2, Copy, ExternalLink } from 'lucide-react';
import { formatWebinarDate } from '@/lib/utils/date';
import type { WebinarWithHosts, WebinarStatus } from '@/types';

interface WebinarCardProps {
  webinar: WebinarWithHosts & { registration_count?: number };
  companyId: string;
}

/**
 * Webinar Card
 * Summary card for webinar in dashboard list
 */
export function WebinarCard({ webinar, companyId }: WebinarCardProps) {
  const statusColors: Record<WebinarStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    live: 'bg-red-100 text-red-700',
    ended: 'bg-green-100 text-green-700',
    cancelled: 'bg-amber-100 text-amber-700',
  };

  const statusLabels: Record<WebinarStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    live: 'Live',
    ended: 'Ended',
    cancelled: 'Cancelled',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        {/* Cover Image */}
        <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {webinar.cover_image_url ? (
            <Image
              src={webinar.cover_image_url}
              alt={webinar.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Calendar className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <Link
                href={`/dashboard/${companyId}/webinars/${webinar.id}`}
                className="font-semibold text-gray-900 hover:text-blue-600"
              >
                {webinar.title}
              </Link>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[webinar.status]
                }`}
              >
                {statusLabels[webinar.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {webinar.registration_count !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {webinar.registration_count} registered
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/${companyId}/webinars/${webinar.id}`}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
              {webinar.status !== 'draft' && (
                <Link
                  href={`/webinar/${webinar.slug}`}
                  target="_blank"
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="View"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WebinarListProps {
  webinars: (WebinarWithHosts & { registration_count?: number })[];
  companyId: string;
}

/**
 * Webinar List
 * List of webinar cards
 */
export function WebinarList({ webinars, companyId }: WebinarListProps) {
  if (webinars.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No webinars yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first webinar to get started.
        </p>
        <Link
          href={`/dashboard/${companyId}/webinars/new`}
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create Webinar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webinars.map((webinar) => (
        <WebinarCard key={webinar.id} webinar={webinar} companyId={companyId} />
      ))}
    </div>
  );
}
