import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignUpForm from '../SignUpForm';
import { createClient } from '@/lib/supabase/client';

// Mock the dependencies
vi.mock('@/lib/supabase/client');

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('SignUpForm', () => {
  const mockSupabaseClient = {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
      insert: vi.fn(),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(
      mockSupabaseClient as ReturnType<typeof createClient>
    );
  });

  it('renders all form fields', () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  describe('Form Validation', () => {
    it('shows email validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      expect(
        await screen.findByText(/please enter a valid email address/i)
      ).toBeInTheDocument();
    });

    it('shows password validation error for short password', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'short');
      await user.tab();

      expect(
        await screen.findByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    it('shows password validation error for missing requirements', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'onlylowercase');
      await user.tab();

      expect(
        await screen.findByText(
          /password must contain uppercase, lowercase, and number/i
        )
      ).toBeInTheDocument();
    });

    it('shows username validation error for short username', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');
      await user.tab();

      expect(
        await screen.findByText(/username must be at least 3 characters/i)
      ).toBeInTheDocument();
    });

    it('shows username validation error for invalid characters', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'user@name');
      await user.tab();

      expect(
        await screen.findByText(
          /username can only contain letters, numbers, underscores, and hyphens/i
        )
      ).toBeInTheDocument();
    });
  });

  describe('Username Availability Check', () => {
    it('shows checking indicator while checking username', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      // Mock the username check to be slow
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(
              () =>
                new Promise((resolve) =>
                  setTimeout(() => resolve({ data: null }), 100)
                )
            ),
          })),
        })),
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      // Wait for debounce and check for spinner
      await waitFor(() => {
        const spinner = screen.getByRole('status', { hidden: true });
        expect(spinner).toHaveClass('animate-spin');
      });
    });

    it('shows success indicator for available username', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      // Mock available username
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'availableuser');

      await waitFor(
        () => {
          // Look for the checkmark SVG
          const checkmark = document.querySelector(
            'svg path[d="M5 13l4 4L19 7"]'
          );
          expect(checkmark).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('shows error for unavailable username', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      // Mock unavailable username
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({
                data: { username: 'takenuser' },
                error: null,
              }),
          })),
        })),
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'takenuser');

      await waitFor(
        () => {
          expect(
            screen.getByText(/username is already taken/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Form Submission', () => {
    it('successfully signs up user with valid data', async () => {
      const user = userEvent.setup();

      // Clear any previous calls
      mockPush.mockClear();
      mockRefresh.mockClear();

      render(<SignUpForm />);

      // Mock available username
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      // Mock successful signup
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: null },
        error: null,
      });

      // Fill form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123');

      // Wait for username check
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'TestPass123',
          options: {
            data: {
              username: 'testuser',
            },
          },
        });
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('shows error message on signup failure', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      // Mock available username
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      });

      // Mock signup failure
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      });

      // Fill form
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/password/i), 'ValidPass123');

      // Wait for username check
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled();
      });

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/email already registered/i)
        ).toBeInTheDocument();
      });
    });

    it('disables submit button when username is not available', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      // Mock unavailable username
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { username: 'taken' }, error: null }),
          })),
        })),
      });

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'taken');
      await user.type(screen.getByLabelText(/password/i), 'ValidPass123');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /sign up/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
