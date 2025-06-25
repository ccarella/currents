import { renderHook, waitFor } from '@testing-library/react';
import { useRequireAuth } from '../useRequireAuth';
import { AuthProvider } from '@/lib/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('useRequireAuth', () => {
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
    vi.clearAllMocks();

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
      },
    };

    vi.mocked(createClient).mockReturnValue(mockSupabaseClient);
  });

  it('redirects to signin when not authenticated', async () => {
    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockPush).toHaveBeenCalledWith('/signin');
  });

  it('redirects to custom path when specified', async () => {
    const { result } = renderHook(
      () => useRequireAuth({ redirectTo: '/custom-login' }),
      {
        wrapper: AuthProvider,
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockPush).toHaveBeenCalledWith('/custom-login');
  });

  it('does not redirect when authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('does not redirect while loading', () => {
    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('calls custom callback instead of redirecting', async () => {
    const onUnauthenticated = vi.fn();

    const { result } = renderHook(() => useRequireAuth({ onUnauthenticated }), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(onUnauthenticated).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('returns correct auth state', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current).toEqual({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });
  });
});
