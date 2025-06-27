import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Page not found
          </h2>
          <p className="text-gray-600">
            This page has drifted away like a passing thought. Perhaps it was
            never meant to be found, or maybe it&apos;s just taking a break.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/">
            <Button variant="primary" size="md">
              Return Home
            </Button>
          </Link>
          <Link href="/write">
            <Button variant="secondary" size="md">
              Share a Thought
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
