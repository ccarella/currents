'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            An unexpected error occurred. The current has shifted unexpectedly,
            but don&apos;t worry - we can navigate back to calmer waters.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error details
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="pt-4">
          <Button variant="primary" size="medium" onClick={reset}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
