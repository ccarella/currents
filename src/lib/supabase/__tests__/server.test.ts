import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '../server';

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    })
  ),
}));

// Mock the @supabase/ssr module
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

describe('Supabase Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create a server client with valid environment variables', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    const client = await createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should throw error when SUPABASE_URL is missing', async () => {
    delete process.env['NEXT_PUBLIC_SUPABASE_URL'];
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    await expect(createClient()).rejects.toThrow(
      'Missing Supabase environment variables'
    );
  });

  it('should throw error when SUPABASE_ANON_KEY is missing', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    await expect(createClient()).rejects.toThrow(
      'Missing Supabase environment variables'
    );
  });
});
