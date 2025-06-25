import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '../ForgotPasswordForm';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  })),
}));

describe('ForgotPasswordForm', () => {
  let mockResetPasswordForEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = vi.mocked(await import('@/lib/supabase/client'));
    mockResetPasswordForEmail = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });
  });

  it('should render the forgot password form', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send reset link' })
    ).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', {
      name: 'Send reset link',
    });

    // Test invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('should handle successful password reset request', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(
        screen.getByText(/We've sent a password reset link to test@example.com/)
      ).toBeInTheDocument();
    });
  });

  it('should handle rate limiting error', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(
        screen.getByText('Too many reset attempts. Please try again later.')
      ).toBeInTheDocument();
    });
  });

  it('should handle general errors', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Something went wrong' },
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'));

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    mockResetPasswordForEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    const submitButton = screen.getByRole('button', {
      name: 'Send reset link',
    });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Sending reset link...');
  });

  it('should have proper accessibility attributes', () => {
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
  });
});
