'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@whop/react/components';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Webinar Error Boundary
 * Displays when an error occurs in the webinar funnel
 */
export default function WebinarError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Webinar error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>

        <p className="mb-6 text-gray-600">
          We couldn&apos;t load this webinar. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="solid" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button
            variant="soft"
            onClick={() => (window.location.href = '/')}
          >
            Go Home
          </Button>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
