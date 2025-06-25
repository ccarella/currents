import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import SignOutButton from '../SignOutButton';
import { createClient } from '@/lib/supabase/client';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('SignOutButton', () => {
  const mockPush = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.mocked(createClient).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('should render sign out button', () => {
    render(<SignOutButton />);

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should handle successful sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should handle sign out error gracefully', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      // Even with error, it should still redirect
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should handle network error during sign out', async () => {
    mockSignOut.mockRejectedValue(new Error('Network error'));

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      // Should not redirect on network error
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
