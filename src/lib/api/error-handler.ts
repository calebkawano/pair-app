import { logger } from '@/lib/logger';
import { PriceServiceError } from '@/lib/pricing/price-service';
import { SupabaseError } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  status: number;
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  logger.error('API Error:', error);

  // Handle known error types
  if (error instanceof SupabaseError) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: error.details,
      status: 500
    }, { status: 500 });
  }

  if (error instanceof PriceServiceError) {
    return NextResponse.json({
      error: error.message,
      details: error.details,
      status: 500
    }, { status: 500 });
  }

  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return NextResponse.json({
      error: 'Validation failed',
      details: error.message,
      status: 400
    }, { status: 400 });
  }

  // Handle unauthorized errors
  if (error instanceof Error && error.message.toLowerCase().includes('unauthorized')) {
    return NextResponse.json({
      error: 'Unauthorized',
      details: error.message,
      status: 401
    }, { status: 401 });
  }

  // Default error response
  return NextResponse.json({
    error: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error',
    status: 500
  }, { status: 500 });
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
} 