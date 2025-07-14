import { logger } from '@/lib/logger';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { ClientApiError } from './errors';
import type { ApiRoute } from './routes';

// ---------------------------------------------------------------------------
// 🛠️  Configuration & Constants
// ---------------------------------------------------------------------------

/** Base back-off delay (in milliseconds) for retry logic. */
const BASE_DELAY_MS = 200;

/** How long (in ms) to cache the Supabase JWT locally. */
const TOKEN_CACHE_MS = 30_000;

// ---------------------------------------------------------------------------
// 🔐  Auth token cache
// ---------------------------------------------------------------------------

let cachedToken: string | undefined;
let cachedTokenFetchedAt = 0;

/**
 * Fetches the current Supabase access token, caching it for {@link TOKEN_CACHE_MS} ms to
 * avoid excessive <code>supabase.auth.getSession()</code> calls.
 */
async function getAuthToken(): Promise<string | undefined> {
  const now = Date.now();
  if (cachedToken && now - cachedTokenFetchedAt < TOKEN_CACHE_MS) {
    return cachedToken;
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error({ msg: 'Failed to retrieve Supabase session', error });
      return undefined;
    }

    const token = data.session?.access_token;
    if (token) {
      cachedToken = token;
      cachedTokenFetchedAt = now;
    }

    return token;
  } catch (err) {
    logger.error({ msg: 'getAuthToken threw', err });
    return undefined;
  }
}

interface Options<Req, Res> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Req;
  schema?: z.ZodSchema<Res>;
  toastSuccess?: string;
  toastError?: string;
  signal?: AbortSignal;
  retries?: number; // default 0
  credentials?: 'include' | 'omit' | 'same-origin';
  /**
   * How long to wait before aborting the request (defaults to 15 s).
   */
  timeoutMs?: number;
  /**
   * Force JSON parsing even when no schema is provided.
   * Useful when callers need raw JSON and cannot supply a zod schema.
   */
  parseJson?: boolean;
}

// ---------------------------------------------------------------------------
// 🚀  Main helper
// ---------------------------------------------------------------------------

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
    credentials = 'same-origin',
    timeoutMs = 15_000,
    parseJson = false,
  }: Options<Req, Res> = {},
): Promise<Res> {
  const attempt = async (attemptNo: number): Promise<Res> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    // Set up timeout controller (unless the caller provided their own signal)
    const abortController = signal ? null : new AbortController();
    const fetchSignal = signal ?? abortController!.signal;

    let timeoutHandle: NodeJS.Timeout | undefined;
    if (!signal) {
      timeoutHandle = setTimeout(() => abortController!.abort(), timeoutMs);
    }

    try {
      const res = await fetch(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
        credentials,
        signal: fetchSignal,
      });

      if (timeoutHandle) clearTimeout(timeoutHandle);

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      // Retry on 5xx status codes
      if (res.status >= 500 && attemptNo < retries) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attemptNo) * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, delayMs));
        return attempt(attemptNo + 1);
      }

      // Handle non-OK responses
      if (!res.ok) {
        const errPayload: unknown = isJson ? await res.json().catch(() => ({})) : undefined;

        const payloadMessage =
          typeof errPayload === 'object' && errPayload !== null && 'message' in errPayload &&
          typeof (errPayload as { message: unknown }).message === 'string'
            ? (errPayload as { message: string }).message
            : undefined;

        const apiError = new ClientApiError(
          res.status,
          url,
          errPayload,
          payloadMessage ?? res.statusText,
        );

        logger.error({ id: apiError.id, status: apiError.status, url: apiError.url, payload: apiError.payload });
        if (toastError) toast.error(toastError);
        throw apiError;
      }

      if (toastSuccess) toast.success(toastSuccess);

      // Decide whether to parse the body
      let data: unknown;
      if (schema || parseJson) {
        data = isJson ? await res.json() : undefined;
      }

      if (schema) return schema.parse(data);
      return data as Res;
    } catch (err) {
      // Convert network / abort errors into ClientApiError
      if (err instanceof ClientApiError) {
        throw err; // already wrapped
      }

      const apiError = new ClientApiError(
        0,
        url,
        null,
        err instanceof Error ? err.message : 'Network error',
      );

      logger.error({ id: apiError.id, status: apiError.status, url: apiError.url, payload: apiError.payload });
      if (toastError) toast.error(toastError);
      throw apiError;
    }
  };

  return attempt(0);
} 