'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getCurrentUserProfile } from '@/lib/supabase/profiles';
import type { Database } from '@/types/database.generated';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchProfile() {
      try {
        setLoading(true);
        const userProfile = await getCurrentUserProfile();
        if (!cancelled) {
          setProfile(userProfile);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to fetch profile')
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    profile,
    loading: authLoading || loading,
    error,
    isAuthenticated: !!user,
  };
}
