import { z } from 'zod';
import { fetchJson } from './fetchJson';
import type { ApiRoute } from './routes';

/**
 * Returns a typed POST helper for the given route & response schema.
 *
 * Example:
 *   export const postSomething = postJson(route, responseSchema)(body);
 */
export function postJson<Req, Res>(
  route: ApiRoute,
  schema: z.ZodSchema<Res>,
  toastSuccess?: string,
) {
  return (
    body: Req,
    opts?: { timeoutMs?: number; retries?: number },
  ) =>
    fetchJson<Req, Res>(route, {
      body,
      schema,
      toastSuccess,
      method: 'POST',
      timeoutMs: opts?.timeoutMs,
      retries: opts?.retries,
      parseJson: true,
    });
} 