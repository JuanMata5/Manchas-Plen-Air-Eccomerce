import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  interval: number;
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.ip ?? 'unknown';
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, limit } = config;
  const store = new Map<string, RateLimitEntry>();

  function cleanup() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetTime) {
        store.delete(key);
      }
    }
  }

  return function check(request: NextRequest): RateLimitResult {
    cleanup();

    const ip = getClientIp(request);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now >= entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + interval });
      return { success: true, remaining: limit - 1, reset: now + interval };
    }

    entry.count += 1;

    if (entry.count > limit) {
      return { success: false, remaining: 0, reset: entry.resetTime };
    }

    return { success: true, remaining: limit - entry.count, reset: entry.resetTime };
  };
}

// Pre-configured limiters
export const apiLimiter = rateLimit({ interval: 60_000, limit: 60 });
export const authLimiter = rateLimit({ interval: 60_000, limit: 5 });
export const paymentLimiter = rateLimit({ interval: 60_000, limit: 10 });

// Helper that returns a 429 NextResponse if rate limited, or null if the request is allowed
export function withRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof rateLimit>
): NextResponse | null {
  const result = limiter(request);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(0),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    );
  }

  return null;
}
