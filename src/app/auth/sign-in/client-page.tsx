'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const SignInForm = dynamic(
  () => import('@/components/auth/SignInForm').then((mod) => mod.SignInForm),
  {
    loading: () => (
      <div className="w-full max-w-md p-8 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ClientSignInPage() {
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
