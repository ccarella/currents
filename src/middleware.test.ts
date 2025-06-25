import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock @supabase/ssr before importing middleware
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

// Mock next/server to handle the request object properly
vi.mock('next/server', async () => {
  const actual =
    await vi.importActual<typeof import('next/server')>('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      next: vi.fn((_init?: ResponseInit) => {
        const response = new actual.NextResponse(null, { status: 200 });
        // Mock cookies methods
        response.cookies.set = vi.fn();
        response.cookies.getAll = vi.fn(() => []);
        return response;
      }),
      redirect: vi.fn((url: string | URL) => {
        const response = new actual.NextResponse(null, { status: 307 });
        response.headers.set('location', url.toString());
        return response;
      }),
    },
  };
});

import { middleware, config } from './middleware';

// Helper function to create a mock NextRequest
function createMockRequest(
  url: string,
  options?: {
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  }
) {
  // Create proper headers instance
  const headers = new Headers(options?.headers);

  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    headers,
  });

  // Mock cookies if needed
  if (options?.cookies) {
    const cookieStore = new Map<string, string>();
    Object.entries(options.cookies).forEach(([name, value]) => {
      cookieStore.set(name, value);
    });

    // Override cookie methods
    Object.defineProperty(request, 'cookies', {
      value: {
        get: (name: string) => ({ value: cookieStore.get(name), name }),
        getAll: () =>
          Array.from(cookieStore.entries()).map(([name, value]) => ({
            name,
            value,
          })),
        set: (name: string, value: string) => cookieStore.set(name, value),
        delete: (name: string) => cookieStore.delete(name),
        has: (name: string) => cookieStore.has(name),
      },
      writable: false,
      configurable: true,
    });
  }

  return request;
}

describe('Middleware', () => {
  const originalEnv = process.env;
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockCreateServerClient: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    // Reset mocks
    vi.clearAllMocks();

    // Get the mocked createServerClient
    const { createServerClient } = await import('@supabase/ssr');
    mockCreateServerClient = vi.mocked(createServerClient);

    // Setup mock for createServerClient
    mockGetUser = vi.fn();
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Variables', () => {
    it('should handle missing SUPABASE_URL', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should handle missing SUPABASE_ANON_KEY', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe('Protected Routes', () => {
    const protectedRoutes = ['/write', '/profile', '/dashboard', '/settings'];

    protectedRoutes.forEach((route) => {
      it(`should redirect to sign-in for ${route} when not authenticated`, async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(307); // Redirect status
        expect(response.headers.get('location')).toBe(
          `http://localhost:3000/auth/sign-in?redirect=${encodeURIComponent(route)}`
        );
      });

      it(`should allow access to ${route} when authenticated`, async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      });
    });

    it('should preserve the path but not query parameters when redirecting to sign-in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = createMockRequest('/profile?tab=settings');
      const response = await middleware(request);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/sign-in');
      expect(location).toContain('redirect=%2Fprofile');
      // The middleware preserves the pathname but not the query params in the redirect param
    });
  });

  describe('Auth Routes', () => {
    const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

    authRoutes.forEach((route) => {
      it(`should redirect to home from ${route} when authenticated`, async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe('http://localhost:3000/');
      });

      it(`should allow access to ${route} when not authenticated`, async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = ['/', '/about', '/blog', '/contact'];

    publicRoutes.forEach((route) => {
      it(`should allow access to ${route} when not authenticated`, async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      });

      it(`should allow access to ${route} when authenticated`, async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        });

        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Cookie Handling', () => {
    it('should preserve cookies through the middleware', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = createMockRequest('/', {
        cookies: {
          'test-cookie': 'test-value',
          'another-cookie': 'another-value',
        },
      });

      const response = await middleware(request);

      expect(response).toBeDefined();
      // Verify that the Supabase client received the cookies
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });

    it('should handle cookie updates from Supabase', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = createMockRequest('/');
      const response = await middleware(request);

      // Verify response is returned correctly
      expect(response).toBeDefined();

      // Test that setAll function works correctly
      const cookieOptions = mockCreateServerClient.mock.calls[0][2];

      // Simulate Supabase setting cookies
      const cookiesToSet = [
        {
          name: 'sb-access-token',
          value: 'token123',
          options: { httpOnly: true },
        },
        {
          name: 'sb-refresh-token',
          value: 'refresh123',
          options: { httpOnly: true },
        },
      ];

      cookieOptions.cookies.setAll(cookiesToSet);

      // Verify cookies were set on the request
      expect(request.cookies.get('sb-access-token')?.value).toBe('token123');
      expect(request.cookies.get('sb-refresh-token')?.value).toBe('refresh123');
    });
  });

  describe('Config Matcher', () => {
    it('should have correct matcher configuration', () => {
      expect(config.matcher).toEqual([
        '/write',
        '/profile/:path*',
        '/dashboard/:path*',
        '/settings/:path*',
        '/auth/:path*',
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle auth.getUser errors gracefully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error'),
      });

      const request = createMockRequest('/profile');
      const response = await middleware(request);

      // Should redirect to sign-in when user is null (regardless of error)
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/auth/sign-in');
    });

    it('should handle Supabase client creation errors', async () => {
      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      const request = createMockRequest('/');

      // Should throw the error since it's not caught in the middleware
      await expect(middleware(request)).rejects.toThrow(
        'Client creation failed'
      );
    });
  });

  describe('Nested Protected Routes', () => {
    it('should protect nested routes under protected paths', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const nestedRoutes = [
        '/profile/edit',
        '/dashboard/analytics',
        '/settings/security',
      ];

      for (const route of nestedRoutes) {
        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toContain('/auth/sign-in');
      }
    });
  });
});
