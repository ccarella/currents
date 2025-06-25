import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export default async function ForgotPasswordPage() {
  // Redirect if already authenticated
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>
        <ForgotPasswordForm />
        <div className="text-center text-sm">
          <Link
            href="/auth/sign-in"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
