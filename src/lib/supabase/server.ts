import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies()
  // Minimal typing interface for cookies store
  interface CookieStore {
    get: (name: string) => { value: string } | undefined;
    set: (data: { name: string; value: string; path?: string; maxAge?: number; expires?: Date; }) => void;
  }
  const store = cookieStore as unknown as CookieStore;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            store.set({ name, value, ...options })
          } catch {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            store.set({ name, value: '', ...options })
          } catch {
            // Handle cookie errors
          }
        },
      },
    }
  )
} 