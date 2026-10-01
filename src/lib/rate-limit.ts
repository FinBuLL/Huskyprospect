import { headers } from 'next/headers';

/**
 * Simple in-memory fixed-window rate limiter for server actions.
 * Note: state is per server instance. For multi-instance deployments use a
 * shared store (e.g. Redis / Upstash) instead.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export class RateLimitError extends Error {
  constructor() {
    super('Too many requests. Please try again later.');
    this.name = 'RateLimitError';
  }
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || h.get('x-real-ip') || 'unknown';
}

export async function enforceRateLimit(action: string, limit: number, windowMs: number): Promise<void> {
  const key = `${action}:${await clientKey()}`;
  const now = Date.now();

  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) throw new RateLimitError();
  bucket.count++;
}
