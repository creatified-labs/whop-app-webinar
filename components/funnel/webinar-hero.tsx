'use client';

import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import { formatWebinarDate, formatDuration } from '@/lib/utils/date';
import type { WebinarPublicView } from '@/types';

interface WebinarHeroProps {
  webinar: WebinarPublicView;
}

/**
 * Webinar Hero
 * Hero section with cover image, title, date/time, duration
 */
export function WebinarHero({ webinar }: WebinarHeroProps) {
  return (
    <div className="space-y-6">
      {/* Company Logo */}
      {webinar.company.image_url && (
        <div className="flex justify-center">
          <Image
            src={webinar.company.image_url}
            alt={webinar.company.name}
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </div>
      )}

      {/* Cover Image */}
      {webinar.cover_image_url && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200">
          <Image
            src={webinar.cover_image_url}
            alt={webinar.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title & Meta */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {webinar.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatWebinarDate(webinar.scheduled_at, webinar.timezone)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(webinar.duration_minutes)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
