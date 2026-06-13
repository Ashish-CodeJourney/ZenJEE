// =============================================================================
// Simple in-memory rate limiter for Next.js API routes.
// Uses a sliding window per IP address.
// On Vercel, each serverless invocation gets its own memory, so this is
// per-instance — adequate for preventing individual runaway clients, not
// for distributed DDoS protection (use Vercel's built-in WAF for that).
// =============================================================================

type WindowEntry = {
  count: number;
  resetAt: number; // epoch ms
};

const store = new Map<string, WindowEntry>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Checks whether `identifier` (typically an IP) is within `maxRequests`
 * per `windowMs` milliseconds.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  store.set(identifier, { ...entry, count: entry.count + 1 });
  return { allowed: true };
}

/** Extracts the best available client IP from a Next.js request. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
