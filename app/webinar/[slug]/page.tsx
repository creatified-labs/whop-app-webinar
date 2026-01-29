import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWebinarPublicView } from "@/lib/data/webinars";
import { WebinarHero } from "@/components/funnel/webinar-hero";
import { HostList } from "@/components/funnel/host-card";
import { SocialProof } from "@/components/funnel/social-proof";
import { CountdownBanner } from "@/components/funnel/countdown-timer";
import { InlineRegistrationForm } from "@/components/funnel/registration-form";
import { Play, Radio } from "lucide-react";

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
    title: webinar.title,
    description: webinar.description || `Join ${webinar.title}`,
    openGraph: {
      title: webinar.title,
      description: webinar.description || `Join ${webinar.title}`,
      images: webinar.cover_image_url ? [webinar.cover_image_url] : [],
    },
  };
}

/**
 * Webinar Landing Page
 * Premium public page for webinar registration
 */
export default async function WebinarLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const webinar = await getWebinarPublicView(slug);

  if (!webinar) {
    notFound();
  }

  const isLive = webinar.status === "live";
  const isEnded = webinar.status === "ended";

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-funnel-fade-in space-y-8">
        {/* Hero Section */}
        <WebinarHero webinar={webinar} />

        {/* Countdown or Status Banner */}
        {!isLive && !isEnded && (
          <div
            className="animate-funnel-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CountdownBanner targetDate={webinar.scheduled_at} />
          </div>
        )}

        {isLive && (
          <div
            className="animate-funnel-scale-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="funnel-glass rounded-funnel-xl px-6 py-4 text-center ring-1 ring-green-500/30">
              <span className="inline-flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
                <span className="font-semibold text-green-400">
                  Live Now - Join the Stream
                </span>
                <Radio className="h-4 w-4 text-green-400" />
              </span>
            </div>
          </div>
        )}

        {isEnded && webinar.cta_url && (
          <div
            className="animate-funnel-scale-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="funnel-glass rounded-funnel-xl px-6 py-4 text-center ring-1 ring-indigo-500/30">
              <p className="text-funnel-text-secondary">
                This webinar has ended.{" "}
                <a
                  href={webinar.cta_url}
                  className="inline-flex items-center gap-1.5 font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                >
                  <Play className="h-4 w-4" />
                  Watch the replay
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Registration Card */}
        {!isEnded && (
          <div
            className="animate-funnel-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="funnel-glass rounded-funnel-2xl p-6 shadow-funnel-lg sm:p-8">
              <InlineRegistrationForm slug={slug} ctaText={webinar.cta_text} />
            </div>
          </div>
        )}

        {/* Description */}
        {webinar.description && (
          <div
            className="animate-funnel-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="rounded-funnel-xl p-6">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-funnel-text-muted">
                About this webinar
              </h3>
              <p className="whitespace-pre-wrap leading-relaxed text-funnel-text-secondary">
                {webinar.description}
              </p>
            </div>
          </div>
        )}

        {/* Hosts Section */}
        {webinar.show_host_info && webinar.hosts.length > 0 && (
          <div
            className="animate-funnel-fade-in border-t border-funnel-border/30 pt-8"
            style={{ animationDelay: "0.4s" }}
          >
            <HostList hosts={webinar.hosts} />
          </div>
        )}

        {/* Floating Social Proof Pill */}
        <div
          className="animate-funnel-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          <SocialProof registrationCount={webinar.registration_count} />
        </div>
      </div>
    </main>
  );
}
