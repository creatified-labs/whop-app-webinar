/**
 * Settings Page Loading State
 * Skeleton loading for settings page
 */
export default function SettingsLoading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-gray-a3" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded-lg bg-gray-a2" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Company Profile Skeleton */}
          <div className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
            <div className="mb-4">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-a3" />
              <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-a2" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 animate-pulse rounded-full bg-gray-a3" />
                <div className="flex-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-a3 mb-2" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-a3" />
                </div>
              </div>
              <div>
                <div className="h-4 w-28 animate-pulse rounded bg-gray-a3 mb-2" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-a3" />
              </div>
              <div className="flex justify-end">
                <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-a3" />
              </div>
            </div>
          </div>

          {/* Team Members Skeleton */}
          <div className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
            <div className="mb-4">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-a3" />
              <div className="mt-1 h-4 w-56 animate-pulse rounded bg-gray-a2" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-a3 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-a3" />
                    <div>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-a3" />
                      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-a2" />
                    </div>
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-a3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notification Settings Skeleton */}
          <div className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
            <div className="mb-4">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-a3" />
              <div className="mt-1 h-4 w-56 animate-pulse rounded bg-gray-a2" />
            </div>
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-a3 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-a3" />
                    <div>
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-a3" />
                      <div className="mt-1 h-3 w-48 animate-pulse rounded bg-gray-a2" />
                    </div>
                  </div>
                  <div className="h-5 w-9 animate-pulse rounded-full bg-gray-a3" />
                </div>
              ))}
              <div className="flex justify-end">
                <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-a3" />
              </div>
            </div>
          </div>

          {/* Default Webinar Settings Skeleton */}
          <div className="rounded-2xl border border-gray-a4 bg-gray-a2 p-5">
            <div className="mb-4">
              <div className="h-5 w-44 animate-pulse rounded bg-gray-a3" />
              <div className="mt-1 h-4 w-52 animate-pulse rounded bg-gray-a2" />
            </div>
            <div className="space-y-4">
              {/* Select fields */}
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-a3 mb-2" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-gray-a3" />
                </div>
              ))}
              {/* Feature toggles */}
              <div className="h-4 w-28 animate-pulse rounded bg-gray-a3" />
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-gray-a3 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-a3" />
                    <div>
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-a3" />
                      <div className="mt-1 h-3 w-36 animate-pulse rounded bg-gray-a2" />
                    </div>
                  </div>
                  <div className="h-5 w-9 animate-pulse rounded-full bg-gray-a3" />
                </div>
              ))}
              <div className="flex justify-end">
                <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-a3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
