import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from '../ResetPasswordForm';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

describe('ResetPasswordForm', () => {
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;
  let mockRouterPush: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const { useRouter } = vi.mocked(await import('next/navigation'));
    mockRouterPush = vi.fn();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockRouterPush,
    });

    const { createClient } = vi.mocked(await import('@/lib/supabase/client'));
    mockGetSession = vi.fn();
    mockUpdateUser = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getSession: mockGetSession,
        updateUser: mockUpdateUser,
      },
    });

    // Default to valid session
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: '123' } } },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the reset password form with valid token', async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Update password' })
      ).toBeInTheDocument();
    });
  });

  it('should show invalid token message when session is invalid', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid session' },
    });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired link')).toBeInTheDocument();
      expect(
        screen.getByText(/This password reset link is invalid or has expired/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Request new password reset' })
      ).toBeInTheDocument();
    });
  });

  it('should validate password requirements', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    // Test short password
    await user.type(passwordInput, 'short');
    await user.type(confirmInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });

    // Test password without required characters
    await user.clear(passwordInput);
    await user.clear(confirmInput);
    await user.type(passwordInput, 'onlylowercase');
    await user.type(confirmInput, 'onlylowercase');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must contain at least one uppercase letter/)
      ).toBeInTheDocument();
    });
  });

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'DifferentPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should handle successful password reset', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password updated successfully')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You will be redirected to the sign-in page/)
      ).toBeInTheDocument();
    });

    // Test redirect after 3 seconds
    vi.advanceTimersByTime(3000);
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  it('should handle expired token error', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Token expired' },
    });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/This password reset link has expired/)
      ).toBeInTheDocument();
    });
  });

  it('should handle general errors', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Something went wrong' },
    });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockRejectedValue(new Error('Network error'));

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('New password');
    const confirmInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', {
      name: 'Update password',
    });

    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'ValidPass123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Updating password...');
  });

  it('should have proper accessibility attributes', async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      const passwordInput = screen.getByLabelText('New password');
      const confirmInput = screen.getByLabelText('Confirm new password');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(confirmInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('autoComplete', 'new-password');
    });
  });
});
