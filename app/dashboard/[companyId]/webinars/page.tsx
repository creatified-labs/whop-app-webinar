import Link from 'next/link';
import { headers } from 'next/headers';
import { Plus, Calendar } from 'lucide-react';
import { Card, Heading, Text, Button } from '@whop/react/components';
import { whopsdk } from '@/lib/whop-sdk';
import { getCompanyByWhopId } from '@/lib/data/companies';
import { getCompanyWebinars, getWebinarStatusCounts } from '@/lib/data/webinars';
import { WebinarList } from '@/components/dashboard/webinar-card';
import { WebinarFilters } from '@/components/dashboard/webinar-filters';
import type { WebinarStatus } from '@/types/database';

interface WebinarsPageProps {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

const ITEMS_PER_PAGE = 12;

export default async function WebinarsPage({ params, searchParams }: WebinarsPageProps) {
  const { companyId: whopCompanyId } = await params;
  const { status, search, page } = await searchParams;

  // Verify user
  await whopsdk.verifyUserToken(await headers());

  // Get company from our database
  const company = await getCompanyByWhopId(whopCompanyId);
  if (!company) {
    return (
      <div className="p-6">
        <Card size="3">
          <div className="flex flex-col items-center py-8">
            <Heading size="4" weight="semi-bold" className="mb-2">
              Company not found
            </Heading>
            <Text size="2" color="gray">
              Please refresh the page to sync your company data.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // Parse filters
  const currentPage = parseInt(page || '1', 10);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const statusFilter = status && status !== 'all' ? (status as WebinarStatus) : undefined;

  // Get webinars and counts in parallel (skip status check for faster loading)
  const [{ webinars, total }, counts] = await Promise.all([
    getCompanyWebinars(company.id, {
      status: statusFilter,
      search,
      limit: ITEMS_PER_PAGE,
      offset,
      skipStatusCheck: true, // Skip status check for list views - faster loading
    }),
    getWebinarStatusCounts(company.id, search), // Single query for all counts
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Heading size="6" weight="bold">
            Webinars
          </Heading>
          <Text size="2" color="gray" className="mt-1">
            Create and manage all your webinars
          </Text>
        </div>
        <Link href={`/dashboard/${whopCompanyId}/webinars/new`}>
          <Button size="2" variant="solid">
            <Plus className="h-4 w-4" />
            Create Webinar
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <WebinarFilters
          companyId={whopCompanyId}
          currentStatus={status || 'all'}
          currentSearch={search}
          counts={counts}
        />
      </div>

      {/* Webinar Grid */}
      {webinars.length > 0 ? (
        <>
          <WebinarList
            webinars={webinars.map((w) => ({ ...w, registration_count: 0 }))}
            companyId={whopCompanyId}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <PaginationLink
                href={`/dashboard/${whopCompanyId}/webinars?${buildQueryString({ status, search, page: currentPage - 1 })}`}
                disabled={currentPage <= 1}
              >
                Previous
              </PaginationLink>
              <Text size="2" color="gray" className="px-4">
                Page {currentPage} of {totalPages}
              </Text>
              <PaginationLink
                href={`/dashboard/${whopCompanyId}/webinars?${buildQueryString({ status, search, page: currentPage + 1 })}`}
                disabled={currentPage >= totalPages}
              >
                Next
              </PaginationLink>
            </div>
          )}
        </>
      ) : (
        <Card size="3">
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 rounded-3 bg-gray-a3 p-4">
              <Calendar className="h-8 w-8 text-gray-8" />
            </div>
            <Heading size="4" weight="semi-bold" className="mb-2">
              {search || status ? 'No webinars found' : 'No webinars yet'}
            </Heading>
            <Text size="2" color="gray" className="mb-6 text-center max-w-md">
              {search || status
                ? 'Try adjusting your filters or search term to find what you\'re looking for.'
                : 'Create your first webinar to start engaging your audience.'}
            </Text>
            {!search && !status && (
              <Link href={`/dashboard/${whopCompanyId}/webinars/new`}>
                <Button size="2" variant="solid">
                  <Plus className="h-4 w-4" />
                  Create Webinar
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function buildQueryString(params: { status?: string; search?: string; page?: number }): string {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString());
  return searchParams.toString();
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded-2 border border-gray-a4 bg-gray-a2 px-4 py-2 text-2 font-medium text-gray-8">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-2 border border-gray-a4 bg-gray-1 px-4 py-2 text-2 font-medium text-gray-11 transition-colors hover:bg-gray-a2 hover:text-gray-12"
    >
      {children}
    </Link>
  );
}
