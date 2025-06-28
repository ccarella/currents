import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import ClientSignInPage from './client-page';

export default async function SignInPage() {
  // Redirect if already authenticated
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect('/');
  }

  return <ClientSignInPage />;
}
