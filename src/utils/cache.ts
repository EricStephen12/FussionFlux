import { Redis } from '@upstash/redis';

class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      await this.redis.set(key, JSON.stringify(value), { ex: ttl });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T | null> {
    try {
      const cached = await this.get<T>(key);
      if (cached) return cached;

      const fresh = await fetchFn();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      return null;
    }
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  // Specific cache methods for our application
  async getCampaignStats(campaignId: string) {
    return this.getOrSet(
      this.generateKey('campaign', campaignId, 'stats'),
      async () => {
        // Fetch fresh stats
        const stats = await analyticsService.getCampaignMetrics(campaignId);
        return stats;
      },
      1800 // 30 minutes cache
    );
  }

  async getUserNichePerformance(userId: string) {
    return this.getOrSet(
      this.generateKey('user', userId, 'niche-performance'),
      async () => {
        const performance = await analyticsService.getNichePerformance(userId);
        return performance;
      },
      3600 // 1 hour cache
    );
  }

  async getEmailTemplates(niche: string) {
    return this.getOrSet(
      this.generateKey('templates', niche),
      async () => {
        // const templates = await sendGridService.getTemplates();
        return [];
      },
      7200 // 2 hours cache
    );
  }

  async invalidateCampaignCache(campaignId: string) {
    await this.delete(this.generateKey('campaign', campaignId, 'stats'));
  }

  async invalidateUserCache(userId: string) {
    await Promise.all([
      this.delete(this.generateKey('user', userId, 'niche-performance')),
      this.delete(this.generateKey('user', userId, 'campaigns')),
      this.delete(this.generateKey('user', userId, 'stats')),
    ]);
  }
}

export const cacheService = new CacheService(); 