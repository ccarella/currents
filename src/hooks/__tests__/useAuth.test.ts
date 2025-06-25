import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '@/lib/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('useAuth', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
  };

  const mockSession: Session = {
    access_token: 'test-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 1234567890,
    refresh_token: 'test-refresh-token',
    user: mockUser,
  };

  let mockSupabaseClient: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);
  });

  it('provides all auth methods and state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('signIn');
    expect(result.current).toHaveProperty('signUp');
    expect(result.current).toHaveProperty('signOut');
    expect(result.current).toHaveProperty('resetPassword');
    expect(result.current).toHaveProperty('updatePassword');
  });

  it('reflects authentication state correctly', async () => {
    // Start with no session
    const { result, rerender } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);

    // Simulate auth state change to signed in
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const authChangeCallback =
      mockSupabaseClient.auth.onAuthStateChange.mock.calls[0][0];
    authChangeCallback('SIGNED_IN', mockSession);

    rerender();

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
  });

  it('provides working auth methods', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Test signIn method
    await result.current.signIn('test@example.com', 'password');
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });

    // Test signOut method
    await result.current.signOut();
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  });
});
