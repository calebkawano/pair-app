import { logger } from '@/lib/logger';
import { Database } from '@/types/database';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export async function createClient() {
  try {
    const cookieStore = await cookies();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new SupabaseError('Supabase URL is not defined');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new SupabaseError('Supabase anonymous key is not defined');
    }

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value || null;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              logger.error('Error setting cookie:', error);
              throw new SupabaseError(
                'Failed to set cookie',
                'COOKIE_ERROR',
                error instanceof Error ? error.message : undefined
              );
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            } catch (error) {
              logger.error('Error removing cookie:', error);
              throw new SupabaseError(
                'Failed to remove cookie',
                'COOKIE_ERROR',
                error instanceof Error ? error.message : undefined
              );
            }
          },
        },
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
        },
        global: {
          headers: {
            'x-application-name': 'pair-app',
          },
        },
      }
    );
  } catch (error) {
    logger.error('Error creating Supabase client:', error);
    throw new SupabaseError(
      'Failed to create Supabase client',
      'CLIENT_ERROR',
      error instanceof Error ? error.message : undefined
    );
  }
} 