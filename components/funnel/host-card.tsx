import Image from 'next/image';
import type { WebinarHost } from '@/types/database';
import { getInitials } from '@/lib/utils';

interface HostCardProps {
  host: Pick<WebinarHost, 'name' | 'title' | 'bio' | 'image_url'>;
}

/**
 * Host Card
 * Display host information with avatar, name, title, and optional bio
 */
export function HostCard({ host }: HostCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100">
        {host.image_url ? (
          <Image
            src={host.image_url}
            alt={host.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xl font-semibold text-blue-600">
            {getInitials(host.name)}
          </div>
        )}
      </div>

      {/* Name & Title */}
      <div className="mt-3">
        <p className="font-semibold text-gray-900">{host.name}</p>
        {host.title && (
          <p className="text-sm text-gray-500">{host.title}</p>
        )}
      </div>

      {/* Bio (optional - for expanded view) */}
      {host.bio && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{host.bio}</p>
      )}
    </div>
  );
}

interface HostListProps {
  hosts: Pick<WebinarHost, 'id' | 'name' | 'title' | 'bio' | 'image_url'>[];
}

/**
 * Host List
 * Horizontal scrollable list of hosts
 */
export function HostList({ hosts }: HostListProps) {
  if (hosts.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm font-medium uppercase tracking-wide text-gray-500">
        {hosts.length === 1 ? 'Your Host' : 'Your Hosts'}
      </h2>
      <div className="flex justify-center gap-8 overflow-x-auto pb-2">
        {hosts.map((host) => (
          <div key={host.id} className="flex-shrink-0">
            <HostCard host={host} />
          </div>
        ))}
      </div>
    </div>
  );
}
