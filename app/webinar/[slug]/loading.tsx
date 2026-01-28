/**
 * Webinar Loading State
 * Skeleton UI while webinar data loads
 */
export default function WebinarLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Cover Image Skeleton */}
        <div className="mb-8 aspect-video w-full animate-pulse rounded-2xl bg-gray-200" />

        {/* Title Skeleton */}
        <div className="mb-4 h-10 w-3/4 animate-pulse rounded-lg bg-gray-200" />

        {/* Date/Time Skeleton */}
        <div className="mb-6 h-5 w-1/2 animate-pulse rounded bg-gray-200" />

        {/* CTA Button Skeleton */}
        <div className="mb-8 h-12 w-full animate-pulse rounded-xl bg-gray-200" />

        {/* Description Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Hosts Section Skeleton */}
        <div className="mt-12">
          <div className="mb-6 h-6 w-24 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
