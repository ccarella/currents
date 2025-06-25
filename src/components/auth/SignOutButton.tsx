'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    if (isLoading) {
      return;
    }

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
      console.error('Caught error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={(e) => {
        e.preventDefault(); // Prevent any form submission if in a form
        handleSignOut();
      }}
      disabled={isLoading}
      variant="secondary"
      size="sm"
      type="button" // Explicitly set type to prevent form submission
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
