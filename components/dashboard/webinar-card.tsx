'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Edit,
  ExternalLink,
  Clock,
  MoreHorizontal,
  Link2,
  Play,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import {
  Card,
  Badge,
  Text,
  Heading,
  IconButton,
  Button,
  DropdownMenu,
  AlertDialog,
} from '@whop/react/components';
import { formatWebinarDate, formatDuration } from '@/lib/utils/date';
import { deleteWebinar } from '@/app/actions/webinar';
import type { WebinarWithHosts, WebinarStatus } from '@/types';

interface WebinarCardProps {
  webinar: WebinarWithHosts & { registration_count?: number };
  companyId: string;
}

const statusConfig: Record<WebinarStatus, { color: 'gray' | 'blue' | 'red' | 'green' | 'orange'; label: string; dot?: boolean }> = {
  draft: { color: 'gray', label: 'Draft' },
  scheduled: { color: 'blue', label: 'Scheduled' },
  live: { color: 'red', label: 'Live Now', dot: true },
  ended: { color: 'green', label: 'Ended' },
  cancelled: { color: 'orange', label: 'Cancelled' },
};

/**
 * Webinar Card
 * Modern card using Frosted UI components
 */
export function WebinarCard({ webinar, companyId }: WebinarCardProps) {
  const router = useRouter();
  const status = statusConfig[webinar.status];
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webinarWatchUrl = `${baseUrl}/webinar/${webinar.slug}/watch`;
  const webinarRegistrationUrl = `${baseUrl}/webinar/${webinar.slug}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteWebinar(webinar.id);
      if (result.success) {
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        console.error('Failed to delete webinar:', result.error);
      }
    } catch (error) {
      console.error('Failed to delete webinar:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card size="1" className="group overflow-hidden glass shadow-glass glass-interactive">
      {/* Cover Image */}
      <div className="relative -mx-4 -mt-4 mb-4 aspect-video overflow-hidden bg-gray-a2">
        {webinar.cover_image_url ? (
          <Image
            src={webinar.cover_image_url}
            alt={webinar.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-3 bg-gray-a3 p-4">
              <Calendar className="h-8 w-8 text-gray-8" />
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute left-3 top-3">
          <Badge size="1" color={status.color} variant="solid">
            {status.dot && (
              <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            )}
            {status.label}
          </Badge>
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 glass-heavy opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/dashboard/${companyId}/webinars/${webinar.id}`}>
            <Button size="2" variant="solid" highContrast>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          {webinar.status !== 'draft' && (
            <Link href={`/webinar/${webinar.slug}`} target="_blank">
              <Button size="2" variant="soft" highContrast>
                <ExternalLink className="h-4 w-4" />
                View
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <Link href={`/dashboard/${companyId}/webinars/${webinar.id}`}>
          <Heading size="3" weight="semi-bold" className="transition-colors group-hover:text-accent-11">
            {webinar.title}
          </Heading>
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <Text size="1" color="gray" className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
          </Text>
          <Text size="1" color="gray" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {webinar.registration_count || 0}
          </Text>
        </div>
      </div>

      {/* Footer */}
      <div className="-mx-4 -mb-4 mt-4 flex items-center justify-between border-t border-gray-a4 px-4 py-3">
        <Text size="1" color="gray">
          {formatDuration(webinar.duration_minutes)}
        </Text>
        <div className="flex items-center gap-1">
          {webinar.status === 'scheduled' && (
            <IconButton size="1" variant="ghost" color="green">
              <Play className="h-3.5 w-3.5" />
            </IconButton>
          )}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <IconButton size="1" variant="ghost" color="gray">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content size="1" align="end">
              <DropdownMenu.Item onClick={() => copyToClipboard(webinarWatchUrl)}>
                <Link2 className="h-3.5 w-3.5" />
                Copy Webinar Link
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => copyToClipboard(webinarRegistrationUrl)}>
                <ClipboardList className="h-3.5 w-3.5" />
                Copy Registration Link
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Webinar
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Content size="2">
          <AlertDialog.Title>Delete Webinar</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete &quot;{webinar.title}&quot;? This action cannot be undone
            and will remove all associated registrations and data.
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-3">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
}

interface WebinarListProps {
  webinars: (WebinarWithHosts & { registration_count?: number })[];
  companyId: string;
}

/**
 * Webinar List
 * Grid of webinar cards
 */
export function WebinarList({ webinars, companyId }: WebinarListProps) {
  if (webinars.length === 0) {
    return (
      <Card size="3" className="glass-depth shadow-glass highlight-corner">
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 rounded-3 bg-gray-a3 p-4">
            <Calendar className="h-8 w-8 text-gray-8" />
          </div>
          <Heading size="4" weight="semi-bold" className="mb-2">
            No webinars yet
          </Heading>
          <Text size="2" color="gray">
            Create your first webinar to start engaging your audience.
          </Text>
          <Link href={`/dashboard/${companyId}/webinars/new`} className="mt-6">
            <Button size="2" variant="solid">
              <Calendar className="h-4 w-4" />
              Create Webinar
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {webinars.map((webinar) => (
        <WebinarCard key={webinar.id} webinar={webinar} companyId={companyId} />
      ))}
    </div>
  );
}
