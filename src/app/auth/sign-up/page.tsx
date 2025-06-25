import Link from 'next/link';
import { SignUpForm } from '@/components/auth';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export default async function SignUpPage() {
  // Redirect if already authenticated
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/sign-in"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
