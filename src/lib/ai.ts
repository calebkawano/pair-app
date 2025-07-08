import { OpenAI } from 'openai';
import { ZodSchema } from 'zod';

/**
 * Shared OpenAI client instance – avoid re-creating across route handlers.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generic wrapper around a chat completion that attempts up to three times
 * (with progressively lower temperature) and validates the JSON response with Zod.
 */
export async function callChat<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>
): Promise<T> {
  const temps = [0.8, 0.5, 0.3];
  let lastError: unknown;

  for (const temperature of temps) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature,
      });

      const raw = completion.choices[0].message.content ?? '';
      const parsedJson = JSON.parse(raw);
      return schema.parse(parsedJson);
    } catch (error) {
      lastError = error;
      // continue to next, lowering temperature
    }
  }

  throw lastError ?? new Error('OpenAI chat completion failed');
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter – 30 requests per user per endpoint per hour.
// ---------------------------------------------------------------------------

type RateKey = string; // `${userId}:${endpoint}`
interface Bucket {
  count: number;
  expiresAt: number;
}

const buckets = new Map<RateKey, Bucket>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQ = 30;

/**
 * Returns true if the request is within the rate limit, false otherwise.
 */
export function rateLimiter(userId: string, endpoint: string): boolean {
  const now = Date.now();
  const key = `${userId}:${endpoint}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQ) {
    return false;
  }

  bucket.count += 1;
  return true;
} 