import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webinar',
  description: 'Join our live webinar',
};

interface FunnelLayoutProps {
  children: React.ReactNode;
}

/**
 * Funnel Layout
 * Minimal layout for public webinar pages (no Whop navigation)
 */
export default function FunnelLayout({ children }: FunnelLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
