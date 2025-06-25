import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

export async function requireAuth(
  redirectTo: string = '/auth/sign-in'
): Promise<User> {
  const { user, error } = await getAuthenticatedUser();

  if (error || !user) {
    redirect(redirectTo);
  }

  return user;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return { session, error };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  return { error };
}

export async function updateUser(updates: {
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser(updates);

  return { data, error };
}

export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env['NEXT_PUBLIC_SITE_URL']}/auth/reset-password`,
  });

  return { data, error };
}
