import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignUpPage from '../page';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
vi.mock('@/lib/supabase/auth');
vi.mock('@/lib/supabase/client');

const mocks = {
  redirect: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mocks.redirect(...args),
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

describe('SignUp Page Integration', () => {
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
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: null });
  });

  it('renders the signup page with correct layout', async () => {
    render(await SignUpPage());

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/auth/sign-in'
    );
  });

  it('redirects to home if user is already authenticated', async () => {
    mocks.redirect.mockClear();

    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com' },
    });

    await SignUpPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/');
  });

  it('completes full signup flow successfully', async () => {
    const user = userEvent.setup();

    mocks.push.mockClear();
    mocks.refresh.mockClear();

    render(await SignUpPage());

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
      data: { user: { id: 'new-user-123' }, session: null },
      error: null,
    });

    // Fill and submit form
    await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
    await user.type(screen.getByLabelText(/username/i), 'newusername');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123');

    // Wait for username validation
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    // Verify signup was called with correct data
    await waitFor(() => {
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'SecurePass123',
        options: {
          data: {
            username: 'newusername',
          },
        },
      });
    });

    // Verify profile creation
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        id: 'new-user-123',
        username: 'newusername',
      });
    });

    // Verify redirect
    expect(mocks.push).toHaveBeenCalledWith('/');
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
