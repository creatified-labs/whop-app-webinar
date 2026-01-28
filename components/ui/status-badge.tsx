/**
 * Status Badge Component
 * Displays webinar or other entity status
 */

import type { WebinarStatus, PollStatus, EmailStatus } from '@/types/database';

type StatusType = WebinarStatus | PollStatus | EmailStatus | 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { bg: string; text: string; label: string }> = {
  // Webinar statuses
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
  live: { bg: 'bg-red-100', text: 'text-red-700', label: 'Live' },
  ended: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Ended' },
  cancelled: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Cancelled' },

  // Poll statuses
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },

  // Email statuses
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  sent: { bg: 'bg-green-100', text: 'text-green-700', label: 'Sent' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },

  // Generic statuses
  success: { bg: 'bg-green-100', text: 'text-green-700', label: 'Success' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warning' },
  error: { bg: 'bg-red-100', text: 'text-red-700', label: 'Error' },
  info: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Info' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      {status === 'live' && (
        <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />
      )}
      {label || config.label}
    </span>
  );
}

/**
 * Live indicator dot
 */
export function LiveIndicator({ isLive }: { isLive: boolean }) {
  if (!isLive) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-sm font-medium text-red-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      LIVE
    </span>
  );
}
