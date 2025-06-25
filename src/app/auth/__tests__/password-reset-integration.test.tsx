import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../forgot-password/page';
import ResetPasswordPage from '../reset-password/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Supabase auth utility
vi.mock('@/lib/supabase/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

describe('Password Reset Integration Tests', () => {
  let mockGetAuthenticatedUser: ReturnType<typeof vi.fn>;
  let mockResetPasswordForEmail: ReturnType<typeof vi.fn>;
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;
  let mockRedirect: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { getAuthenticatedUser } = vi.mocked(
      await import('@/lib/supabase/auth')
    );
    mockGetAuthenticatedUser = getAuthenticatedUser as ReturnType<typeof vi.fn>;
    mockGetAuthenticatedUser.mockResolvedValue({ user: null, error: null });

    const { redirect } = vi.mocked(await import('next/navigation'));
    mockRedirect = redirect as ReturnType<typeof vi.fn>;

    const { createClient } = vi.mocked(await import('@/lib/supabase/client'));
    mockResetPasswordForEmail = vi.fn();
    mockGetSession = vi.fn();
    mockUpdateUser = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getSession: mockGetSession,
        updateUser: mockUpdateUser,
      },
    });
  });

  describe('Forgot Password Page', () => {
    it('should redirect authenticated users to home', async () => {
      mockGetAuthenticatedUser.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
        error: null,
      });

      await ForgotPasswordPage();

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('should render forgot password form for unauthenticated users', async () => {
      const page = await ForgotPasswordPage();
      render(page);

      expect(screen.getByText('Reset your password')).toBeInTheDocument();
      expect(
        screen.getByText(/Enter your email address and we'll send you a link/)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Back to sign in' })
      ).toHaveAttribute('href', '/auth/sign-in');
    });
  });

  describe('Reset Password Page', () => {
    it('should render reset password form', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const page = await ResetPasswordPage();
      render(page);

      expect(screen.getByText('Set new password')).toBeInTheDocument();
      expect(
        screen.getByText('Enter your new password below.')
      ).toBeInTheDocument();
    });
  });

  describe('End-to-End Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      const user = userEvent.setup();

      // Step 1: Render forgot password page
      const forgotPasswordPage = await ForgotPasswordPage();
      const { unmount } = render(forgotPasswordPage);

      // Step 2: Submit email for password reset
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const emailInput = screen.getByLabelText('Email address');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Send reset link' }));

      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument();
      });

      // Simulate user clicking link in email (clean up and render reset page)
      unmount();

      // Step 3: Render reset password page with valid session
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const resetPasswordPage = await ResetPasswordPage();
      render(resetPasswordPage);

      // Wait for form to render
      await waitFor(() => {
        expect(screen.getByLabelText('New password')).toBeInTheDocument();
      });

      // Step 4: Submit new password
      mockUpdateUser.mockResolvedValue({ error: null });

      const passwordInput = screen.getByLabelText('New password');
      const confirmInput = screen.getByLabelText('Confirm new password');

      await user.type(passwordInput, 'NewSecurePass123');
      await user.type(confirmInput, 'NewSecurePass123');
      await user.click(screen.getByRole('button', { name: 'Update password' }));

      await waitFor(() => {
        expect(
          screen.getByText('Password updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('should handle errors at each step', async () => {
      const user = userEvent.setup();

      // Test email submission error
      const forgotPasswordPage = await ForgotPasswordPage();
      const { unmount } = render(forgotPasswordPage);

      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      });

      const emailInput = screen.getByLabelText('Email address');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Send reset link' }));

      await waitFor(() => {
        expect(
          screen.getByText('Too many reset attempts. Please try again later.')
        ).toBeInTheDocument();
      });

      unmount();

      // Test invalid session on reset page
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' },
      });

      const resetPasswordPage = await ResetPasswordPage();
      render(resetPasswordPage);

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired link')).toBeInTheDocument();
      });
    });

    it('should validate email and password formats', async () => {
      const user = userEvent.setup();

      // Test email validation
      const forgotPasswordPage = await ForgotPasswordPage();
      const { unmount } = render(forgotPasswordPage);

      const emailInput = screen.getByLabelText('Email address');
      await user.type(emailInput, 'invalid-email');
      await user.click(screen.getByRole('button', { name: 'Send reset link' }));

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      });

      unmount();

      // Test password validation
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const resetPasswordPage = await ResetPasswordPage();
      render(resetPasswordPage);

      await waitFor(() => {
        expect(screen.getByLabelText('New password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText('New password');
      const confirmInput = screen.getByLabelText('Confirm new password');

      // Test mismatched passwords
      await user.type(passwordInput, 'ValidPass123');
      await user.type(confirmInput, 'DifferentPass123');
      await user.click(screen.getByRole('button', { name: 'Update password' }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });
});
