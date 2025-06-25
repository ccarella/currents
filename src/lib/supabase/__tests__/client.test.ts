import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @supabase/ssr module
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

describe('Supabase Client Configuration', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Clear module cache to reset singleton
    vi.resetModules();
    // Mock window object for browser environment
    global.window = {} as Window & typeof globalThis;
  });

  afterEach(() => {
    // Restore original env and window
    process.env = originalEnv;
    global.window = originalWindow;
  });

  it('should create a client with valid environment variables', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    const { createClient } = await import('../client');
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should throw error when SUPABASE_URL is missing', async () => {
    delete process.env['NEXT_PUBLIC_SUPABASE_URL'];
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    const { createClient } = await import('../client');
    expect(() => createClient()).toThrow(
      'Missing Supabase environment variables'
    );
  });

  it('should throw error when SUPABASE_ANON_KEY is missing', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    const { createClient } = await import('../client');
    expect(() => createClient()).toThrow(
      'Missing Supabase environment variables'
    );
  });

  it('should return the same client instance on subsequent calls (singleton pattern)', async () => {
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    const { createClient } = await import('../client');
    const client1 = createClient();
    const client2 = createClient();

    expect(client1).toBe(client2);
  });

  it('should throw error when used in server environment', async () => {
    // Remove window to simulate server environment
    delete (global as { window?: Window }).window;

    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co';
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key';

    const { createClient } = await import('../client');
    expect(() => createClient()).toThrow(
      'Client should only be used in browser environment'
    );
  });
});
