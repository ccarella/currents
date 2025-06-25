import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUser } from '../useUser';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('useUser', () => {
  const mockGetUser = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
    } as unknown as ReturnType<typeof createClient>);
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it('should return null user when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  it('should return user when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBe(null);
    });
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to get user');
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.error).toEqual(mockError);
    });
  });

  it('should update user on auth state change', async () => {
    const initialUser = { id: '123', email: 'test@example.com' };
    const updatedUser = { id: '456', email: 'updated@example.com' };

    mockGetUser.mockResolvedValue({
      data: { user: initialUser },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.user).toEqual(initialUser);
    });

    // Simulate auth state change
    const authStateChangeCallback = mockOnAuthStateChange.mock.calls[0]?.[0];
    act(() => {
      authStateChangeCallback('SIGNED_IN', { user: updatedUser });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  it('should handle sign out', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Simulate sign out
    const authStateChangeCallback = mockOnAuthStateChange.mock.calls[0]?.[0];
    act(() => {
      authStateChangeCallback('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
    });
  });

  it('should unsubscribe on unmount', () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { unmount } = renderHook(() => useUser());

    expect(mockUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
