import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../server';
import { createServerClient } from '@supabase/ssr';

// Mock createServerClient to capture cookie configuration
vi.mock('@supabase/ssr');

// Mock Next.js cookies
const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'test-cookie', value: 'test-value' }]),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe('Supabase Server Cookie Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';
  });

  it('should pass cookie getAll functionality correctly', async () => {
    await createClient();

    const mockCall = vi.mocked(createServerClient).mock.calls[0];
    if (!mockCall) throw new Error('Mock not called');
    const cookieConfig = mockCall[2];

    // Test getAll
    const cookies = cookieConfig.cookies.getAll();
    expect(cookies).toEqual([{ name: 'test-cookie', value: 'test-value' }]);
    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });

  it('should handle cookie setAll functionality correctly', async () => {
    await createClient();

    const mockCall = vi.mocked(createServerClient).mock.calls[0];
    if (!mockCall) throw new Error('Mock not called');
    const cookieConfig = mockCall[2];

    // Test setAll
    const cookiesToSet = [
      { name: 'auth-token', value: 'token123', options: { httpOnly: true } },
      {
        name: 'refresh-token',
        value: 'refresh123',
        options: { httpOnly: true },
      },
    ];

    cookieConfig.cookies.setAll?.(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('auth-token', 'token123', {
      httpOnly: true,
    });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'refresh-token',
      'refresh123',
      { httpOnly: true }
    );
  });

  it('should handle Server Component cookie errors gracefully', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    // Mock set to throw Server Component error
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('cookies() can only be called in a Server Component');
    });

    await createClient();

    const mockCall = vi.mocked(createServerClient).mock.calls[0];
    if (!mockCall) throw new Error('Mock not called');
    const cookieConfig = mockCall[2];

    // Should not throw
    expect(() => {
      cookieConfig.cookies.setAll?.([
        { name: 'test', value: 'value', options: {} },
      ]);
    }).not.toThrow();

    // Should not log warning for expected error
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should log warning for unexpected cookie errors', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    // Mock set to throw unexpected error
    const unexpectedError = new Error('Network error');
    mockCookieStore.set.mockImplementation(() => {
      throw unexpectedError;
    });

    await createClient();

    const mockCall = vi.mocked(createServerClient).mock.calls[0];
    if (!mockCall) throw new Error('Mock not called');
    const cookieConfig = mockCall[2];

    // Should not throw
    expect(() => {
      cookieConfig.cookies.setAll?.([
        { name: 'test', value: 'value', options: {} },
      ]);
    }).not.toThrow();

    // Should log warning for unexpected error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Unexpected error setting cookies:',
      unexpectedError
    );

    consoleWarnSpy.mockRestore();
  });
});
