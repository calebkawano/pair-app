// Canonical browser-side Supabase client
import { Database } from '@/types/database'
import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | undefined

/**
 * Returns a singleton browser Supabase client. PersistSession & autoRefreshToken
 * are enabled so the user stays signed in across refreshes.
 */
export function createClient() {
  if (_client) return _client
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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