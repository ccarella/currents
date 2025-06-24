import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    }
  }))
}))

describe('Supabase Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset modules to ensure fresh imports
    vi.resetModules()
  })

  it('should create a Supabase client with environment variables', async () => {
    // Set environment variables
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co'
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key'

    // Import the module (this will trigger the client creation)
    const { supabase } = await import('../lib/supabase')

    // Verify createClient was called with correct parameters
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )

    // Verify the client exists
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should throw an error if environment variables are missing', async () => {
    // Clear environment variables
    delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    // Attempt to import should throw an error
    await expect(async () => {
      await import('../lib/supabase')
    }).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw an error if only URL is missing', async () => {
    // Set only one environment variable
    delete process.env['NEXT_PUBLIC_SUPABASE_URL']
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'test-anon-key'

    await expect(async () => {
      await import('../lib/supabase')
    }).rejects.toThrow('Missing Supabase environment variables')
  })

  it('should throw an error if only anon key is missing', async () => {
    // Set only one environment variable
    process.env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://test.supabase.co'
    delete process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    await expect(async () => {
      await import('../lib/supabase')
    }).rejects.toThrow('Missing Supabase environment variables')
  })
})