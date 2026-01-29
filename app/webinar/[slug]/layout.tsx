import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webinar",
  description: "Join our live webinar",
};

interface FunnelLayoutProps {
  children: React.ReactNode;
}

/**
 * Funnel Layout
 * Premium dark-mode first layout for public webinar pages
 */
export default function FunnelLayout({ children }: FunnelLayoutProps) {
  return (
    <div className="dark min-h-screen bg-funnel-bg-primary dark:bg-zinc-950">
      {/* Mesh gradient background */}
      <div className="funnel-mesh-bg fixed inset-0 opacity-60 dark:opacity-30" />

      {/* Subtle noise texture */}
      <div className="fixed inset-0 bg-[url('/noise.svg')] opacity-[0.02] dark:opacity-[0.03]" />

      {/* Decorative gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-violet-500/15 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative">{children}</div>
    </div>
  );
}
