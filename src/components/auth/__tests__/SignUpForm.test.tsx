import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpForm from '../SignUpForm';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('SignUpForm', () => {
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  it('should render sign up form with email and password fields', () => {
    render(<SignUpForm />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('should handle successful sign up', async () => {
    mockSignUp.mockResolvedValue({
      error: null,
      data: { user: { id: '123' }, session: null },
    });

    render(<SignUpForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign Up');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(
        screen.getByText('Please check your email to confirm your sign up.')
      ).toBeInTheDocument();
    });
  });

  it('should display error message on sign up failure', async () => {
    const errorMessage = 'User already registered';
    mockSignUp.mockResolvedValue({
      error: { message: errorMessage },
      data: { user: null, session: null },
    });

    render(<SignUpForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign Up');

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(
        screen.queryByText('Please check your email to confirm your sign up.')
      ).not.toBeInTheDocument();
    });
  });

  it('should clear messages on new submission', async () => {
    const errorMessage = 'User already registered';
    mockSignUp
      .mockResolvedValueOnce({
        error: { message: errorMessage },
        data: { user: null, session: null },
      })
      .mockResolvedValueOnce({
        error: null,
        data: { user: { id: '123' }, session: null },
      });

    render(<SignUpForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign Up');

    // First submission with error
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Second submission successful
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      expect(
        screen.getByText('Please check your email to confirm your sign up.')
      ).toBeInTheDocument();
    });
  });

  it('should require email and password fields', () => {
    render(<SignUpForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should handle password requirements error', async () => {
    const errorMessage = 'Password should be at least 6 characters';
    mockSignUp.mockResolvedValue({
      error: { message: errorMessage },
      data: { user: null, session: null },
    });

    render(<SignUpForm />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign Up');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
