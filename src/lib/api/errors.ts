export class ClientApiError extends Error {
  /**
   * A unique identifier for this error instance, useful for correlating logs and user-facing “support IDs”.
   */
  public readonly id: string;

  /**
   * The URL that was being fetched when the error occurred. Helps with tracing and debugging.
   */
  public readonly url: string;

  /**
   * Optional response payload or additional context returned by the server.
   */
  public readonly payload?: unknown;

  constructor(
    /** HTTP status code. Use <code>0</code> for network-level failures. */
    public status: number,
    url: string,
    payload?: unknown,
    message = 'Request failed',
  ) {
    super(message);
    this.name = 'ClientApiError';

    this.url = url;
    this.payload = payload;

    // Generate a stable UUID. Falls back to a pseudo-random string if <code>crypto.randomUUID</code> is unavailable (e.g. older Node versions).
    this.id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10);

    // Preserve original stack for better DX when supported.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientApiError);
    }
  }
} 