import Link from 'next/link';
import { SignInForm } from '@/components/auth';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export default async function SignInPage() {
  // Redirect if already authenticated
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
