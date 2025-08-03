// Canonical browser-side Supabase client
import { Database } from '@/types/database'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Returns a singleton browser Supabase client. PersistSession & autoRefreshToken
 * are enabled so the user stays signed in across refreshes.
 */
export function createClient() {
  if (_client) return _client
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('URL exists:', !!supabaseUrl);
    console.error('Key exists:', !!supabaseKey);
    throw new Error('Supabase environment variables are not loaded');
  }
  
  _client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
  return _client
}

// Named export expected by new modules
export const supabaseBrowser = createClient()
