'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  companyId: string;
}

const navItems = [
  { href: '', label: 'Dashboard' },
  { href: '/webinars', label: 'Webinars' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardNav({ companyId }: DashboardNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${companyId}`;

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === '') {
      // Dashboard is active only on exact match
      return pathname === basePath || pathname === `${basePath}/`;
    }
    // Other pages are active if pathname starts with their path
    return pathname.startsWith(fullPath);
  };

  return (
    <nav className="hidden items-center gap-0.5 rounded-full border border-gray-a4 bg-gray-a2 p-1 md:flex">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className={`
              rounded-full px-4 py-1.5 text-2 font-medium transition-all
              ${active
                ? 'bg-gray-1 text-gray-12 shadow-sm'
                : 'text-gray-11 hover:text-gray-12'}
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNav({ companyId }: DashboardNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${companyId}`;

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === '') {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto rounded-full border border-gray-a4 bg-gray-a2 p-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={`${basePath}${item.href}`}
            className={`
              whitespace-nowrap rounded-full px-4 py-1.5 text-2 font-medium transition-all
              ${active
                ? 'bg-gray-1 text-gray-12 shadow-sm'
                : 'text-gray-11 hover:text-gray-12'}
            `}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
