import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { z } from 'zod';
import { ClientApiError } from './errors';
import type { ApiRoute } from './routes';

interface Options<Req, Res> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Req;
  schema?: z.ZodSchema<Res>;
  toastSuccess?: string;
  toastError?: string;
  signal?: AbortSignal;
  retries?: number; // default 0
  credentials?: 'include' | 'omit';
}

async function getAuthToken(): Promise<string | undefined> {
  // TODO: replace with real auth lookup (e.g. from NextAuth session)
  return undefined;
}

export async function fetchJson<Req = unknown, Res = unknown>(
  url: ApiRoute,
  {
    method = 'POST',
    body,
    schema,
    toastSuccess,
    toastError,
    signal,
    retries = 0,
    credentials = 'include',
  }: Options<Req, Res> = {},
): Promise<Res> {
  const attempt = async (remainingRetries: number): Promise<Res> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers,
      credentials,
      signal,
    });

    // Retry logic for server errors
    if (res.status >= 500 && remainingRetries > 0) {
      const backoff = 200 * Math.pow(2, retries - remainingRetries);
      await new Promise((r) => setTimeout(r, backoff));
      return attempt(remainingRetries - 1);
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!res.ok) {
      const errPayload: unknown = isJson ? await res.json().catch(() => ({})) : {};
      logger.error({ url, status: res.status, errPayload });
      if (toastError) toast.error(toastError);

      // Attempt to extract a human-readable message field in a type-safe way
      const payloadMessage =
        typeof errPayload === 'object' && errPayload !== null && 'message' in errPayload &&
        typeof (errPayload as { message: unknown }).message === 'string'
          ? (errPayload as { message: string }).message
          : undefined;

      throw new ClientApiError(res.status, payloadMessage ?? res.statusText);
    }

    if (toastSuccess) toast.success(toastSuccess);

    const data: unknown = isJson ? await res.json() : undefined;
    if (schema) return schema.parse(data);
    return data as Res;
  };

  return attempt(retries);
} 