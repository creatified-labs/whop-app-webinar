"use client";

import Image from "next/image";
import { Calendar, Clock, Video } from "lucide-react";
import { formatWebinarDate, formatDuration } from "@/lib/utils/date";
import type { WebinarPublicView } from "@/types";

interface WebinarHeroProps {
  webinar: WebinarPublicView;
}

/**
 * Webinar Hero
 * Premium hero section with gradient borders, glassmorphism effects
 */
export function WebinarHero({ webinar }: WebinarHeroProps) {
  return (
    <div className="space-y-6">
      {/* Company Logo */}
      {webinar.company.image_url && (
        <div className="flex justify-center">
          <div className="rounded-funnel-lg bg-white/10 p-3 backdrop-blur-sm">
            <Image
              src={webinar.company.image_url}
              alt={webinar.company.name}
              width={120}
              height={40}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>
        </div>
      )}

      {/* Cover Image with Gradient Border */}
      {webinar.cover_image_url && (
        <div className="group funnel-gradient-border overflow-hidden rounded-funnel-2xl">
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
            <Image
              src={webinar.cover_image_url}
              alt={webinar.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Video badge */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
              <Video className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-white">Live Webinar</span>
            </div>
          </div>
        </div>
      )}

      {/* Title & Meta */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-funnel-text-primary sm:text-4xl lg:text-5xl">
          {webinar.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          {/* Date Badge */}
          <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 ring-1 ring-indigo-500/20">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">
              {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
            </span>
          </div>

          {/* Duration Badge */}
          <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 ring-1 ring-purple-500/20">
            <Clock className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              {formatDuration(webinar.duration_minutes)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
