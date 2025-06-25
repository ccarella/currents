import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInForm from '../SignInForm';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('SignInForm', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockSignInWithPassword = vi.fn();

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
        signInWithPassword: mockSignInWithPassword,
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('renders form fields and labels', () => {
    render(<SignInForm />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'validpassword'); // Add valid password to isolate email validation
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
      expect(mockSignInWithPassword).not.toHaveBeenCalled(); // Form shouldn't submit with invalid email
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
      expect(mockSignInWithPassword).not.toHaveBeenCalled(); // Form shouldn't submit with short password
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Signing in...' })
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  it('displays error message on failed authentication', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid login credentials';
    mockSignInWithPassword.mockResolvedValue({
      error: { message: errorMessage },
    });

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles unexpected errors gracefully', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
  });

  it('shows validation errors on blur with invalid input', async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');

    // Type invalid email and blur
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    // Type short password and blur
    await user.type(passwordInput, '123');
    await user.tab();

    // Submit to trigger validation
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Password must be at least 6 characters')
      ).toBeInTheDocument();
    });
  });

  it('links to sign up page', () => {
    render(<SignInForm />);

    const signUpLink = screen.getByRole('link', { name: 'Sign up' });
    expect(signUpLink).toHaveAttribute('href', '/auth/sign-up');
  });
});
