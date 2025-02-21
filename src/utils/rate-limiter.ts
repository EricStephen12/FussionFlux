import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

interface RateLimitConfig {
  interval: number; // Time window in seconds
  limit: number;    // Number of requests allowed in the time window
}

const defaultConfig: RateLimitConfig = {
  interval: 60,     // 1 minute
  limit: 60,        // 60 requests per minute
};

export async function rateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  const key = `rate-limit:${endpoint}:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.interval);
  const windowEnd = windowStart + config.interval;

  try {
    const [requests] = await redis
      .multi()
      .incr(key)
      .expire(key, config.interval)
      .exec();

    const remaining = Math.max(0, config.limit - (requests as number));

    return {
      success: (requests as number) <= config.limit,
      remaining,
      reset: windowEnd,
    };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open if Redis is down
    return {
      success: true,
      remaining: config.limit,
      reset: windowEnd,
    };
  }
}

export function getRateLimitResponse(rateLimitResult: {
  remaining: number;
  reset: number;
}) {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      },
    }
  );
} 