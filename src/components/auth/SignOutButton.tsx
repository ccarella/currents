'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
      }

      // Always redirect and refresh to update server components
      router.push('/');
      router.refresh(); // This is crucial for updating server-rendered auth state
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant="secondary"
      size="sm"
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
