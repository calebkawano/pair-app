import { logger } from '@/lib/logger';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/learn',
  '/auth/callback',
  '/login',
  '/signup'
];

/**
 * Edge middleware that authenticates every request hitting /api/* routes.
 * If a user session is not found, the request is terminated with 401.
 * Otherwise we forward the request and inject `x-user-id` so that
 * downstream route handlers can reliably identify the user **without**
 * re-querying Supabase.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Generate or extract request ID for correlation
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  
  // Create child logger with request context
  const requestLogger = logger.child({ requestId, path: req.nextUrl.pathname });

  // Initialise Supabase client bound to the middleware request/response
  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Reject unauthenticated requests
  if (!user) {
    requestLogger.warn('Unauthorized API request attempt');
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  requestLogger.info({ userId: user.id }, 'Authenticated API request');

  // Propagate the user id to downstream handlers via request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-request-id', requestId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Limit invocation to API routes only.
 */
export const config = {
  matcher: '/api/:path*',
};

/**
 * Helper for route handlers to guarantee an authenticated user.
 * Throws if the header was not injected by middleware (should not happen).
 */
export function requireUser(req: Request): string {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
} 