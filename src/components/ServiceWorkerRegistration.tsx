'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    let updateIntervalId: number | undefined;

    const handleLoad = () => {
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        process.env.NODE_ENV === 'production'
      ) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates periodically
            updateIntervalId = window.setInterval(
              () => {
                registration.update();
              },
              60 * 60 * 1000
            ); // Check every hour

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (
                    installingWorker.state === 'activated' &&
                    navigator.serviceWorker.controller
                  ) {
                    // New service worker activated
                    // Show notification instead of forcing reload
                    setShowUpdateNotification(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }
    };

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', handleLoad);
    }

    // Cleanup function
    return () => {
      if (updateIntervalId !== undefined) {
        window.clearInterval(updateIntervalId);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleLoad);
      }
    };
  }, []);

  const handleUpdate = () => {
    setShowUpdateNotification(false);
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdateNotification(false);
  };

  if (!showUpdateNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-4 border border-neutral-200 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Update Available
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          A new version of the app is available. Would you like to refresh to
          get the latest version?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Refresh Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
