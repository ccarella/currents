import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { SignInForm, SignUpForm, SignOutButton } from '@/components/auth';

export default async function Header() {
  const { user } = await getAuthenticatedUser();

  return (
    <header>
      <nav>
        {user ? (
          <SignOutButton />
        ) : (
          <>
            <SignInForm />
            <SignUpForm />
          </>
        )}
      </nav>
    </header>
  );
}
