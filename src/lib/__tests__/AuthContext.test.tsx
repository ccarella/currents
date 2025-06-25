import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../AuthContext';
import { createClient } from '@/lib/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('AuthContext', () => {
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
  let mockAuthStateSubscription: { unsubscribe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthStateSubscription = {
      unsubscribe: vi.fn(),
    };

    mockSupabaseClient = {
      auth: {
        getSession: vi
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: mockAuthStateSubscription },
        }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);
  });

  describe('AuthProvider', () => {
    it('provides initial auth state', async () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{auth.loading.toString()}</div>
            <div data-testid="user">{auth.user?.email || 'null'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    it('initializes with existing session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const TestComponent = () => {
        const auth = useAuthContext();
        return <div data-testid="user">{auth.user?.email || 'null'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(
          'test@example.com'
        );
      });
    });

    it('handles auth state changes', async () => {
      const TestComponent = () => {
        const auth = useAuthContext();
        return <div data-testid="user">{auth.user?.email || 'null'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });

      // Simulate auth state change
      const authChangeCallback =
        mockSupabaseClient.auth.onAuthStateChange.mock.calls[0][0];
      authChangeCallback('SIGNED_IN', mockSession);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(
          'test@example.com'
        );
      });
    });

    it('unsubscribes from auth state changes on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      );

      unmount();

      expect(mockAuthStateSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Auth methods', () => {
    it('handles sign in', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signIn('test@example.com', 'password');

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('handles sign in errors', async () => {
      const error = new Error('Invalid credentials');
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error,
      });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signIn('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('handles sign up', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signUp('test@example.com', 'password');

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('handles sign out', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('handles password reset', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.resetPassword('test@example.com');

      expect(
        mockSupabaseClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/reset-password'),
        })
      );
    });

    it('handles password update', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuthContext(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updatePassword('new-password');

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'new-password',
      });
    });
  });

  describe('useAuthContext', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuthContext());
      }).toThrow('useAuthContext must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
