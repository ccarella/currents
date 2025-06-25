'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface UseRequireAuthOptions {
  redirectTo?: string;
  onUnauthenticated?: () => void;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { redirectTo = '/signin', onUnauthenticated } = options;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (onUnauthenticated) {
        onUnauthenticated();
      } else {
        router.push(redirectTo);
      }
    }
  }, [loading, isAuthenticated, router, redirectTo, onUnauthenticated]);

  return {
    user,
    loading,
    isAuthenticated,
  };
}
