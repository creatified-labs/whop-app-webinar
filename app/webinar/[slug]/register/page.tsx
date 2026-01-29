import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, XCircle } from "lucide-react";
import { getWebinarPublicView } from "@/lib/data/webinars";
import { RegistrationForm } from "@/components/funnel/registration-form";
import { formatWebinarDate, formatDuration } from "@/lib/utils/date";

interface PageProps {
  params: Promise<{ slug: string }>;
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
    title: `Register for ${webinar.title}`,
    description: `Sign up for ${webinar.title}`,
  };
}

/**
 * Registration Page
 * Premium dedicated registration form page
 */
export default async function RegisterPage({ params }: PageProps) {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  if (webinar.status === "ended") {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="animate-funnel-fade-in text-center">
          {/* Closed Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 ring-1 ring-funnel-border">
            <XCircle className="h-8 w-8 text-funnel-text-muted" />
          </div>

          <h1 className="text-2xl font-bold text-funnel-text-primary">
            Registration Closed
          </h1>
          <p className="mt-3 text-funnel-text-secondary">
            This webinar has ended and is no longer accepting registrations.
          </p>

          <Link
            href={`/webinar/${slug}`}
            className="mt-6 inline-flex items-center gap-2 text-indigo-400 transition-colors hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to webinar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="animate-funnel-fade-in space-y-6">
        {/* Back Link */}
        <Link
          href={`/webinar/${slug}`}
          className="group inline-flex items-center gap-2 text-sm text-funnel-text-secondary transition-colors hover:text-funnel-text-primary"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-funnel-text-primary sm:text-3xl">
            Register for Webinar
          </h1>

          <div className="funnel-glass rounded-funnel-xl p-4">
            <p className="font-medium text-funnel-text-primary">
              {webinar.title}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-funnel-text-secondary">
                <Calendar className="h-4 w-4 text-indigo-400" />
                {formatWebinarDate(webinar.scheduled_at, webinar.timezone)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-funnel-text-secondary">
                <Clock className="h-4 w-4 text-purple-400" />
                {formatDuration(webinar.duration_minutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div
          className="animate-funnel-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="funnel-glass rounded-funnel-2xl p-6 shadow-funnel-lg">
            <RegistrationForm slug={slug} ctaText={webinar.cta_text} />
          </div>
        </div>

        {/* Privacy note */}
        <p
          className="animate-funnel-fade-in text-center text-xs text-funnel-text-muted"
          style={{ animationDelay: "0.2s" }}
        >
          By registering, you agree to receive emails about this webinar. Your
          email will not be shared with third parties.
        </p>
      </div>
    </main>
  );
}
