'use client';

import { useEffect, useRef } from 'react';

interface LoadingAnnouncementProps {
  message: string;
  isLoading: boolean;
}

export function LoadingAnnouncement({
  message,
  isLoading,
}: LoadingAnnouncementProps) {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading && announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  }, [isLoading, message]);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
