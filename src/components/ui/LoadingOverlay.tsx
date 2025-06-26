'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({
  show,
  message = 'Loading...',
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or when not mounted
  if (!mounted || !show) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
            aria-hidden="true"
          />
          <p className="text-gray-700" id="loading-message">
            {message}
          </p>
          <span className="sr-only">{message}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
