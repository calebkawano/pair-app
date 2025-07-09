import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface SafeErrorResponse {
  status: number;
  message: string;
  id?: string;
  stack?: string;
}

/**
 * Creates a NextResponse with a production-safe error payload while
 * still surfacing rich details during local development.
 *
 * Usage:
 * ```ts
 * try { ... } catch (err) { return handleApiError(err); }
 * ```
 */
export function handleApiError(err: unknown): NextResponse<SafeErrorResponse> {
  const id = uuidv4();

  // Always log full error for tracing
  logger.error({ id, err });

  if (process.env.NODE_ENV === 'production') {
    // Hide implementation details from client
    return NextResponse.json(
      {
        status: 500,
        message: 'Unexpected server error',
        id, // expose short id so support can trace logs
      },
      { status: 500 },
    );
  }

  // Development: return verbose stack/message to speed up debugging
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;

  return NextResponse.json(
    {
      status: 500,
      message,
      id,
      stack,
    },
    { status: 500 },
  );
} 