import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import ClientSignUpPage from './client-page';

export default async function SignUpPage() {
  // Redirect if already authenticated
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect('/');
  }

  return <ClientSignUpPage />;
}
