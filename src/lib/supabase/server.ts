// Canonical server-side Supabase client
import { Database } from '@/types/database'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Re-exported custom error class so existing imports keep working
export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Factory that returns a new server client bound to the current request cookie store
export const supabaseServer = async () => {
  const cookieStore = await cookies()

  if (!supabaseUrl) {
    throw new SupabaseError('Supabase URL is not defined');
  }

  if (!supabaseKey) {
    throw new SupabaseError('Supabase anonymous key is not defined');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Next.js cookies API lacks explicit remove, so we overwrite with maxAge 0
          cookieStore.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
}

// Back-compat: many modules still call `createClient()`
export const createClient = supabaseServer 