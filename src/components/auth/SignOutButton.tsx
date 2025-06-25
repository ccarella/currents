'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('Sign out button clicked');
    if (isLoading) {
      console.log('Already loading, preventing multiple clicks');
      return;
    }

    setIsLoading(true);
    console.log('Starting sign out process...');

    try {
      const supabase = createClient();
      console.log('Supabase client created');

      const { error } = await supabase.auth.signOut();
      console.log('Sign out response:', { error });

      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('Sign out successful, redirecting...');
      }

      // Always redirect and refresh to update server components
      console.log('Pushing to home page...');
      router.push('/');
      console.log('Refreshing router...');
      router.refresh(); // This is crucial for updating server-rendered auth state
      console.log('Router refresh complete');
    } catch (error) {
      console.error('Caught error during sign out:', error);
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={(e) => {
        console.log('Button onClick triggered');
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
