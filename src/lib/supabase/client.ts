import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('Client should only be used in browser environment');
  }

  if (client) return client;

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return client;
}
