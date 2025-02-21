interface YouTubeChannelStats {
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  channelId: string;
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
  };
}

export class YouTubeService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static async fetchWithCache(url: string, cacheKey: string) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  static async getChannelStats(channelUsername: string): Promise<YouTubeChannelStats> {
    try {
      // First try to get channel by username
      const channelByUsernameUrl = `${this.BASE_URL}/channels?part=id,snippet,statistics&forUsername=${channelUsername}&key=${this.API_KEY}`;
      let channelData = await this.fetchWithCache(channelByUsernameUrl, `channel_${channelUsername}`);

      // If not found by username, try custom URL
      if (!channelData.items?.length) {
        const channelByCustomUrl = `${this.BASE_URL}/search?part=snippet&q=${channelUsername}&type=channel&key=${this.API_KEY}`;
        const searchData = await this.fetchWithCache(channelByCustomUrl, `search_${channelUsername}`);
        
        if (!searchData.items?.length) {
          throw new Error('Channel not found');
        }

        const channelId = searchData.items[0].id.channelId;
        const channelByIdUrl = `${this.BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${this.API_KEY}`;
        channelData = await this.fetchWithCache(channelByIdUrl, `channel_id_${channelId}`);
      }

      if (!channelData.items?.length) {
        throw new Error('Could not fetch channel statistics');
      }

      const channel = channelData.items[0];
      return {
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        channelId: channel.id,
        thumbnails: channel.snippet?.thumbnails
      };
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
      throw new Error('Failed to fetch YouTube channel statistics');
    }
  }

  static formatSubscriberCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return count;
  }
} 
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  channelId: string;
  thumbnails?: {
    default?: string;
    medium?: string;
    high?: string;
  };
}

export class YouTubeService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  private static readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static async fetchWithCache(url: string, cacheKey: string) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  static async getChannelStats(channelUsername: string): Promise<YouTubeChannelStats> {
    try {
      // First try to get channel by username
      const channelByUsernameUrl = `${this.BASE_URL}/channels?part=id,snippet,statistics&forUsername=${channelUsername}&key=${this.API_KEY}`;
      let channelData = await this.fetchWithCache(channelByUsernameUrl, `channel_${channelUsername}`);

      // If not found by username, try custom URL
      if (!channelData.items?.length) {
        const channelByCustomUrl = `${this.BASE_URL}/search?part=snippet&q=${channelUsername}&type=channel&key=${this.API_KEY}`;
        const searchData = await this.fetchWithCache(channelByCustomUrl, `search_${channelUsername}`);
        
        if (!searchData.items?.length) {
          throw new Error('Channel not found');
        }

        const channelId = searchData.items[0].id.channelId;
        const channelByIdUrl = `${this.BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${this.API_KEY}`;
        channelData = await this.fetchWithCache(channelByIdUrl, `channel_id_${channelId}`);
      }

      if (!channelData.items?.length) {
        throw new Error('Could not fetch channel statistics');
      }

      const channel = channelData.items[0];
      return {
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        channelId: channel.id,
        thumbnails: channel.snippet?.thumbnails
      };
    } catch (error) {
      console.error('Error fetching YouTube stats:', error);
      throw new Error('Failed to fetch YouTube channel statistics');
    }
  }

  static formatSubscriberCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return count;
  }
} 