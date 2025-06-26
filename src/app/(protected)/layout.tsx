'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isWritePage = pathname === '/write';

  // For write page, use full height without padding
  if (isWritePage) {
    return <div className="h-screen flex flex-col">{children}</div>;
  }

  return <>{children}</>;
}
