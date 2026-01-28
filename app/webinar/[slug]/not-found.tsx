import Link from 'next/link';
import { Video, Home } from 'lucide-react';
import { Button } from '@whop/react/components';

/**
 * Webinar Not Found Page
 * Displayed when a webinar doesn't exist
 */
export default function WebinarNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Video className="h-8 w-8 text-gray-400" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Webinar Not Found
        </h1>

        <p className="mb-6 text-gray-600">
          This webinar doesn&apos;t exist or may have been removed.
        </p>

        <Link href="/">
          <Button variant="solid">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
