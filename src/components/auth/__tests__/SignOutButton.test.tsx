import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  const mockRefresh = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
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
    const user = userEvent.setup();
    mockSignOut.mockResolvedValue({ error: null });

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled(); // Verify refresh is called
    });
  });

  it('should display loading state during sign out', async () => {
    const user = userEvent.setup();
    mockSignOut.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(screen.getByText('Signing out...')).toBeInTheDocument();
      expect(signOutButton).toBeDisabled();
    });
  });

  it('should handle sign out error but still redirect', async () => {
    const user = userEvent.setup();
    mockSignOut.mockResolvedValue({ error: { message: 'Sign out failed' } });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', {
        message: 'Sign out failed',
      });
      // Should still redirect and refresh even with error
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should handle network error during sign out', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    mockSignOut.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Caught error during sign out:',
        error
      );
      // Should not redirect on network error
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should prevent multiple clicks while signing out', async () => {
    const user = userEvent.setup();
    mockSignOut.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(<SignOutButton />);

    const signOutButton = screen.getByText('Sign Out');

    // Click multiple times rapidly
    await user.click(signOutButton);
    await user.click(signOutButton);
    await user.click(signOutButton);

    // Should only call signOut once
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should have correct button styling', () => {
    render(<SignOutButton />);

    const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
    expect(signOutButton).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center'
    );
  });
});
