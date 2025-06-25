'use client';

import { useAuthContext } from '@/lib/AuthContext';

export function useAuth() {
  const context = useAuthContext();

  return {
    user: context.user,
    session: context.session,
    loading: context.loading,
    error: context.error,
    isAuthenticated: !!context.user,
    signIn: context.signIn,
    signUp: context.signUp,
    signOut: context.signOut,
    resetPassword: context.resetPassword,
    updatePassword: context.updatePassword,
  };
}
