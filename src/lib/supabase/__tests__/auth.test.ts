import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthenticatedUser,
  requireAuth,
  resetPasswordForEmail,
} from '../auth';
import { createClient } from '../server';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('../server', () => ({
  createClient: vi.fn(),
}));

describe('Auth utilities', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createClient>
    );
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as ReturnType<typeof cookies>);
  });

  describe('getAuthenticatedUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getAuthenticatedUser();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return error when not authenticated', async () => {
      const mockError = { message: 'Not authenticated', name: 'AuthError' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      const result = await getAuthenticatedUser();
      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle network errors', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'));

      await expect(getAuthenticatedUser()).rejects.toThrow('Network error');
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await requireAuth();
      expect(user).toEqual(mockUser);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should redirect to sign-in when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      await requireAuth();
      expect(redirect).toHaveBeenCalledWith('/auth/sign-in');
    });

    it('should redirect to custom path when specified', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      await requireAuth('/custom-login');
      expect(redirect).toHaveBeenCalledWith('/custom-login');
    });
  });

  describe('Auth operations', () => {
    it('should handle sign up with email/password', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const { data, error } = await mockSupabase.auth.signUp({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(data?.user).toEqual(mockUser);
      expect(error).toBeNull();
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });

    it('should handle sign in with email/password', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123', user: mockUser };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { data, error } = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(data?.user).toEqual(mockUser);
      expect(data?.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const { error } = await mockSupabase.auth.signOut();
      expect(error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle session persistence', async () => {
      const mockSession = {
        access_token: 'token123',
        user: { id: '123', email: 'test@example.com' },
      };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { data, error } = await mockSupabase.auth.getSession();
      expect(data?.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle auth state changes', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = { unsubscribe: vi.fn() };
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: mockUnsubscribe },
      });

      const { data } = mockSupabase.auth.onAuthStateChange(mockCallback);
      expect(data?.subscription).toEqual(mockUnsubscribe);
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        mockCallback
      );
    });
  });

  describe('Error handling', () => {
    it('should handle invalid credentials error', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        name: 'AuthError',
        status: 400,
      };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { error } = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(error).toEqual(mockError);
    });

    it('should handle email already registered error', async () => {
      const mockError = {
        message: 'User already registered',
        name: 'AuthError',
        status: 400,
      };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { error } = await mockSupabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(error).toEqual(mockError);
    });

    it('should handle network timeout', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(
        mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('resetPasswordForEmail', () => {
    beforeEach(() => {
      process.env['NEXT_PUBLIC_SITE_URL'] = 'http://localhost:3000';
    });

    it('should send password reset email successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const { data, error } = await resetPasswordForEmail('test@example.com');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      );
    });

    it('should handle rate limit error', async () => {
      const mockError = {
        message: 'Rate limit exceeded',
        name: 'AuthError',
        status: 429,
      };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { error } = await resetPasswordForEmail('test@example.com');

      expect(error).toEqual(mockError);
    });

    it('should handle invalid email error', async () => {
      const mockError = {
        message: 'Invalid email',
        name: 'AuthError',
        status: 400,
      };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { error } = await resetPasswordForEmail('invalid-email');

      expect(error).toEqual(mockError);
    });

    it('should handle network errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(
        new Error('Network error')
      );

      await expect(resetPasswordForEmail('test@example.com')).rejects.toThrow(
        'Network error'
      );
    });

    it('should use correct redirect URL', async () => {
      process.env['NEXT_PUBLIC_SITE_URL'] = 'https://example.com';
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      await resetPasswordForEmail('test@example.com');

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'https://example.com/auth/reset-password',
        }
      );
    });
  });
});
