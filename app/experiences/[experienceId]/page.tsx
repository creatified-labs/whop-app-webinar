import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Play, Radio, Users, Video } from "lucide-react";
import { whopsdk } from "@/lib/whop-sdk";
import { getCompanyByWhopId } from "@/lib/data/companies";
import { getCompanyWebinars } from "@/lib/data/webinars";
import { formatWebinarDate, formatDuration } from "@/lib/utils/date";
import type { WebinarWithHosts } from "@/types";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // Verify the user is logged in
  const { userId } = await whopsdk.verifyUserToken(await headers());

  // Get the experience and user data
  const [experience, user] = await Promise.all([
    whopsdk.experiences.retrieve(experienceId),
    whopsdk.users.retrieve(userId),
  ]);

  // Get company from our database (experience.company.id is the Whop company ID)
  const company = await getCompanyByWhopId(experience.company.id);

  // Get webinars for this company
  const webinars = company
    ? (await getCompanyWebinars(company.id, { status: ["scheduled", "live", "ended"] })).webinars
    : [];

  const displayName = user.name || `@${user.username}`;
  const liveWebinars = webinars.filter((w) => w.status === "live");
  const upcomingWebinars = webinars.filter((w) => w.status === "scheduled");
  const pastWebinars = webinars.filter((w) => w.status === "ended");

  return (
    <div className="dark min-h-screen bg-funnel-bg-primary">
      {/* Background effects */}
      <div className="funnel-mesh-bg fixed inset-0 opacity-30" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 ring-1 ring-indigo-500/20">
            <Video className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">
              Member Access
            </span>
          </div>
          <h1 className="text-3xl font-bold text-funnel-text-primary sm:text-4xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-3 text-funnel-text-secondary">
            Access your exclusive webinars below
          </p>
        </div>

        {/* Live Now Section */}
        {liveWebinars.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-funnel-text-primary">
                Live Now
              </h2>
            </div>
            <div className="grid gap-6">
              {liveWebinars.map((webinar) => (
                <WebinarCard
                  key={webinar.id}
                  webinar={webinar}
                  variant="live"
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Webinars */}
        {upcomingWebinars.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-semibold text-funnel-text-primary">
              Upcoming Webinars
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {upcomingWebinars.map((webinar) => (
                <WebinarCard
                  key={webinar.id}
                  webinar={webinar}
                  variant="upcoming"
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Webinars / Replays */}
        {pastWebinars.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-semibold text-funnel-text-primary">
              Watch Replays
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastWebinars.map((webinar) => (
                <WebinarCard
                  key={webinar.id}
                  webinar={webinar}
                  variant="replay"
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {webinars.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-funnel-border">
              <Video className="h-10 w-10 text-funnel-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-funnel-text-primary">
              No webinars yet
            </h2>
            <p className="mt-2 text-funnel-text-secondary">
              Check back soon for upcoming webinars
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface WebinarCardProps {
  webinar: WebinarWithHosts;
  variant: "live" | "upcoming" | "replay";
}

function WebinarCard({ webinar, variant }: WebinarCardProps) {
  const isLive = variant === "live";
  const isReplay = variant === "replay";

  return (
    <Link href={`/webinar/${webinar.slug}`}>
      <div
        className={`group funnel-glass overflow-hidden rounded-funnel-xl transition-all duration-300 hover:bg-funnel-bg-elevated/80 ${
          isLive ? "ring-2 ring-red-500/50" : ""
        }`}
      >
        {/* Cover Image */}
        {webinar.cover_image_url && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={webinar.cover_image_url}
              alt={webinar.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status Badge */}
            <div className="absolute left-3 top-3">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
              )}
              {isReplay && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Play className="h-3 w-3" />
                  REPLAY
                </span>
              )}
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-funnel-text-primary line-clamp-2 group-hover:text-indigo-400 transition-colors">
            {webinar.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-funnel-text-secondary">
              <Calendar className="h-4 w-4 text-indigo-400" />
              {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-funnel-text-secondary">
              <Clock className="h-4 w-4 text-purple-400" />
              {formatDuration(webinar.duration_minutes)}
            </span>
          </div>

          {/* Hosts */}
          {webinar.hosts.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {webinar.hosts.slice(0, 3).map((host, i) => (
                  <div
                    key={host.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-medium text-white ring-2 ring-zinc-900"
                    style={{ zIndex: 3 - i }}
                  >
                    {host.name[0]}
                  </div>
                ))}
              </div>
              <span className="text-sm text-funnel-text-muted">
                {webinar.hosts.map((h) => h.name).join(", ")}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4">
            <span
              className={`inline-flex w-full items-center justify-center gap-2 rounded-funnel-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                isLive
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
              }`}
            >
              {isLive && (
                <>
                  <Radio className="h-4 w-4" />
                  Join Live
                </>
              )}
              {variant === "upcoming" && (
                <>
                  <Calendar className="h-4 w-4" />
                  Register Now
                </>
              )}
              {isReplay && (
                <>
                  <Play className="h-4 w-4" />
                  Watch Replay
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
