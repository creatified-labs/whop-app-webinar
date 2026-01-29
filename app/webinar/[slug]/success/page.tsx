import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle, ArrowRight, Mail, Bell } from "lucide-react";
import { getWebinarPublicView } from "@/lib/data/webinars";
import { AddToCalendar } from "@/components/funnel/add-to-calendar";
import { formatWebinarDate } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    return { title: "Webinar Not Found" };
  }

  return {
    title: `Registered for ${webinar.title}`,
    description: `You're registered for ${webinar.title}`,
  };
}

/**
 * Registration Success Page
 * Premium confirmation with celebration effects
 */
export default async function SuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { email } = await searchParams;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="animate-funnel-fade-in space-y-8 text-center">
        {/* Success Icon with Glow */}
        <div className="flex justify-center">
          <div className="funnel-success-glow relative rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 ring-1 ring-green-500/30">
            <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-3">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 animate-funnel-pulse-ring rounded-full ring-2 ring-green-500/50" />
          </div>
        </div>

        {/* Confirmation Message */}
        <div
          className="animate-funnel-slide-up space-y-3"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="text-2xl font-bold text-funnel-text-primary sm:text-3xl">
            You're Registered!
          </h1>
          <p className="text-funnel-text-secondary">
            We've saved your spot for{" "}
            <strong className="text-funnel-text-primary">{webinar.title}</strong>
          </p>
          {email && (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 ring-1 ring-indigo-500/20">
              <Mail className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">{email}</span>
            </div>
          )}
        </div>

        {/* Webinar Details Card */}
        <div
          className="animate-funnel-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="funnel-glass rounded-funnel-xl p-6 text-left">
            <h2 className="font-semibold text-funnel-text-primary">
              {webinar.title}
            </h2>
            <p className="mt-2 text-funnel-text-secondary">
              {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
            </p>
          </div>
        </div>

        {/* Add to Calendar */}
        <div
          className="animate-funnel-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="funnel-glass rounded-funnel-xl p-6 text-left">
            <AddToCalendar
              title={webinar.title}
              description={webinar.description}
              startTime={webinar.scheduled_at}
              durationMinutes={webinar.duration_minutes}
              timezone={webinar.timezone}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className="animate-funnel-slide-up space-y-3"
          style={{ animationDelay: "0.4s" }}
        >
          {webinar.status === "live" && (
            <Link
              href={`/webinar/${slug}/watch?email=${encodeURIComponent(email || "")}`}
              className="funnel-shimmer group flex w-full items-center justify-center gap-2 rounded-funnel-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 text-base font-semibold text-white shadow-funnel-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-funnel-glow"
            >
              Join Live Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          <Link
            href={`/webinar/${slug}`}
            className="flex w-full items-center justify-center rounded-funnel-xl border border-funnel-border bg-funnel-bg-elevated/50 px-6 py-3.5 text-base font-medium text-funnel-text-primary transition-all hover:border-indigo-500/50 hover:bg-funnel-bg-elevated"
          >
            Back to Webinar Page
          </Link>
        </div>

        {/* Reminder */}
        <div
          className="animate-funnel-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800/50 px-4 py-2 ring-1 ring-funnel-border/50">
            <Bell className="h-4 w-4 text-funnel-text-muted" />
            <p className="text-sm text-funnel-text-muted">
              You'll receive a reminder before the webinar starts
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
