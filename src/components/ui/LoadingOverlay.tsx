'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({
  show,
  message = 'Loading...',
}: LoadingOverlayProps) {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
