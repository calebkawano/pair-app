import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { ClientApiError } from './errors';

interface SafeErrorResponse {
  id: string;
  message: string;
  status: number;
}

/**
 * Creates a NextResponse with a production-safe error payload while
 * still surfacing rich details during local development.
 *
 * Usage:
 * ```ts
 * try { ... } catch (err) { return handleApiError(err); }
 * try { ... } catch (err) { return handleApiError(err, 400); }
 * ```
 */
export function handleApiError(err: unknown, defaultStatus = 500): NextResponse<SafeErrorResponse> {
  // Generate or extract error ID
  const id = err instanceof ClientApiError ? err.id : crypto.randomUUID();
  
  // Always log full error for tracing
  logger.error({ id, err });

  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  
  // Handle ClientApiError instances
  if (err instanceof ClientApiError) {
    const response: SafeErrorResponse = {
      id,
      message: err.message,
      status: err.status,
    };
    
    return NextResponse.json(response, { status: err.status });
  }

  // Handle other errors
  if (isProduction) {
    // Hide implementation details from client
    const response: SafeErrorResponse = {
      id,
      message: 'Unexpected server error',
      status: defaultStatus,
    };
    
    return NextResponse.json(response, { status: defaultStatus });
  }

  // Development: return verbose message to speed up debugging
  const message = err instanceof Error ? err.message : 'Unknown error';
  const response: SafeErrorResponse = {
    id,
    message,
    status: defaultStatus,
  };

  return NextResponse.json(response, { status: defaultStatus });
} 