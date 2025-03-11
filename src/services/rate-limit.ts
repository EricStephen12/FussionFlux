import { db } from '@/utils/firebase';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests within the window
}

const TIER_LIMITS: { [key: string]: RateLimitConfig } = {
  pro: {
    windowMs: 60 * 1000, // 1 minute
    max: 100 // 100 requests per minute
  },
  trial: {
    windowMs: 60 * 1000, // 1 minute
    max: 50 // 50 requests per minute
  },
  default: {
    windowMs: 60 * 1000, // 1 minute
    max: 30  // 30 requests per minute
  }
};

export class RateLimitService {
  private rateLimitRef = db.collection('rate_limits');

  async isRateLimited(userId: string, tier: string = 'default'): Promise<{
    limited: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const config = TIER_LIMITS[tier] || TIER_LIMITS.default;
    const now = Date.now();
    const windowStart = now - (now % config.windowMs);
    const windowKey = `${windowStart}`;
    
    const userLimitRef = doc(this.rateLimitRef, `${userId}_${windowKey}`);
    const limitDoc = await getDoc(userLimitRef);

    if (!limitDoc.exists()) {
      // First request in this window
      await setDoc(userLimitRef, {
        count: 1,
        windowStart,
        userId
      }, { merge: true });

      return {
        limited: false,
        remaining: config.max - 1,
        resetTime: windowStart + config.windowMs
      };
    }

    const data = limitDoc.data();
    const currentCount = data?.count || 0;

    if (currentCount >= config.max) {
      return {
        limited: true,
        remaining: 0,
        resetTime: windowStart + config.windowMs
      };
    }

    // Increment the counter
    await setDoc(userLimitRef, {
      count: increment(1)
    }, { merge: true });

    return {
      limited: false,
      remaining: config.max - (currentCount + 1),
      resetTime: windowStart + config.windowMs
    };
  }

  getRateLimitConfig(tier: string): RateLimitConfig {
    return TIER_LIMITS[tier] || TIER_LIMITS.default;
  }
} 