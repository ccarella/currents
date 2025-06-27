import { renderHook, waitFor } from '@testing-library/react';
import { useUserProfile } from '../useUserProfile';
import { useAuth } from '../useAuth';
import { getCurrentUserProfile } from '@/lib/supabase/profiles';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../useAuth');
vi.mock('@/lib/supabase/profiles');

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null profile when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      session: null,
      error: null,
      isAuthenticated: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(getCurrentUserProfile).not.toHaveBeenCalled();
  });

  it('should fetch profile when user is authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockProfile = {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      bio: null,
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as unknown as ReturnType<typeof useAuth>['user'],
      loading: false,
      session: null,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });

    vi.mocked(getCurrentUserProfile).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isAuthenticated).toBe(true);
    expect(getCurrentUserProfile).toHaveBeenCalledTimes(1);
  });

  it('should handle profile fetch errors', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockError = new Error('Failed to fetch profile');

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as unknown as ReturnType<typeof useAuth>['user'],
      loading: false,
      session: null,
      error: null,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });

    vi.mocked(getCurrentUserProfile).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });
});
