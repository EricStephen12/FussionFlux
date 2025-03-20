import axios from 'axios';
import { Lead, LeadSource, LeadSourceAdapter, LeadFetchOptions } from '@/models/LeadTypes';
import { logger } from '@/utils/logger';

// Interface for Instagram profile data
interface InstagramProfile {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  businessEmail?: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  engagement: number;
  postCount: number;
  category?: string;
  location?: string;
  isVerified: boolean;
  isBusinessAccount: boolean;
  businessCategory?: string;
  recentPosts: InstagramPost[];
}

interface InstagramPost {
  id: string;
  shortcode: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  timestamp: string;
  hashtags: string[];
  mentionedAccounts: string[];
}

/**
 * Instagram Source Adapter for fetching high-converting leads from Instagram
 */
export class InstagramSourceAdapter implements LeadSourceAdapter {
  private apiKey: string;
  private apiUrl: string = 'https://api.instagram.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Calculate the conversion potential of an Instagram profile based on engagement and relevance
   */
  private calculateConversionPotential(profile: InstagramProfile, options: LeadFetchOptions): number {
    // Base score
    let score = 0;

    // Follower count weight (diminishing returns after a certain point)
    const followerScore = Math.min(profile.followersCount / 10000, 1) * 0.15;
    
    // Engagement rate (more important than follower count)
    const engagementRate = profile.engagement / profile.followersCount;
    const engagementScore = Math.min(engagementRate * 100, 1) * 0.35;
    
    // Business account bonus (business accounts are more likely to be interested in products)
    const businessScore = profile.isBusinessAccount ? 0.1 : 0;
    
    // Verified account bonus
    const verifiedScore = profile.isVerified ? 0.05 : 0;
    
    // Content relevance to dropshipping or niche
    let contentRelevanceScore = 0;
    if (options.niche && options.niche.length > 0) {
      const relevantHashtags = this.getRelevantHashtags(options.niche[0]);
      let hashtagMatches = 0;
      
      // Check all recent posts for relevant hashtags
      profile.recentPosts.forEach(post => {
        post.hashtags.forEach(tag => {
          if (relevantHashtags.includes(tag.toLowerCase())) {
            hashtagMatches++;
          }
        });
      });
      
      // Calculate relevance score based on hashtag matches
      contentRelevanceScore = Math.min(hashtagMatches / 5, 1) * 0.25;
    }
    
    // Bio relevance - check if niche keywords appear in bio
    let bioRelevanceScore = 0;
    if (options.niche && options.niche.length > 0) {
      const nicheKeywords = options.niche[0].toLowerCase().split(' ');
      const bioWords = profile.bio.toLowerCase().split(' ');
      
      const matches = nicheKeywords.filter(keyword => 
        bioWords.some(word => word.includes(keyword))
      ).length;
      
      bioRelevanceScore = Math.min(matches / nicheKeywords.length, 1) * 0.1;
    }
    
    // Combine all scores
    score = followerScore + engagementScore + businessScore + verifiedScore + contentRelevanceScore + bioRelevanceScore;
    
    // Normalize to 0-1 range
    return Math.min(Math.max(score, 0), 1);
  }
  
  /**
   * Get relevant hashtags for a specific niche
   */
  private getRelevantHashtags(niche: string): string[] {
    // Mapping of niches to relevant hashtags
    const nicheHashtags: Record<string, string[]> = {
      'fashion': ['fashion', 'style', 'clothing', 'outfit', 'ootd', 'fashionista', 'streetwear', 'fashionblogger'],
      'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'beautyproducts', 'beautycare', 'skincareroutine'],
      'homegoods': ['home', 'homedecor', 'interior', 'homestyle', 'furniture', 'interiordesign', 'homeaccessories'],
      'electronics': ['tech', 'electronics', 'gadgets', 'smartphone', 'technology', 'innovation', 'devices'],
      'fitness': ['fitness', 'workout', 'gym', 'exercise', 'fitnessmotivation', 'health', 'training'],
      'jewelry': ['jewelry', 'accessories', 'necklace', 'bracelet', 'rings', 'earrings', 'jewels'],
      'pets': ['pets', 'dog', 'cat', 'petcare', 'petproducts', 'doglovers', 'catlovers', 'petaccessories'],
      'toys': ['toys', 'kids', 'children', 'play', 'games', 'educational', 'fun', 'toddler'],
    };
    
    // Get hashtags for the specified niche or return general e-commerce hashtags
    const nicheLower = niche.toLowerCase();
    for (const [key, tags] of Object.entries(nicheHashtags)) {
      if (nicheLower.includes(key)) {
        return tags;
      }
    }
    
    // Return general e-commerce hashtags if no specific niche match
    return ['ecommerce', 'onlineshopping', 'shopping', 'retail', 'business', 'entrepreneur', 'products', 'dropshipping'];
  }

  /**
   * Map Instagram profile data to our Lead model
   */
  private mapToLead(profile: InstagramProfile, conversionPotential: number): Lead {
    return {
      id: `ig-${profile.id}`,
      firstName: profile.fullName.split(' ')[0],
      lastName: profile.fullName.split(' ').slice(1).join(' '),
      email: profile.businessEmail || profile.email || `${profile.username}@example.com`,
      source: 'instagram' as LeadSource,
      score: Math.round((profile.followersCount > 1000 ? 75 : 60) + (conversionPotential * 25)),
      conversionPotential,
      socialProfiles: {
        instagram: `https://instagram.com/${profile.username}`
      },
      company: profile.isBusinessAccount ? profile.username : undefined,
      title: profile.isBusinessAccount ? 'Business Owner' : 'Content Creator',
      industry: profile.businessCategory || profile.category || 'Social Media',
      location: profile.location || undefined,
      lastActivity: new Date().toISOString(),
      notes: `Instagram ${profile.isVerified ? 'verified ' : ''}${profile.isBusinessAccount ? 'business ' : ''}account with ${profile.followersCount} followers and ${profile.postCount} posts.`,
      tags: ['instagram', profile.isBusinessAccount ? 'business' : 'personal', profile.followersCount > 10000 ? 'influencer' : 'creator'],
      dateAdded: new Date().toISOString()
    };
  }

  /**
   * Fetch leads from Instagram API based on specified options
   */
  async fetchLeads(options: LeadFetchOptions): Promise<Lead[]> {
    try {
      logger.info(`Fetching leads from Instagram with options: ${JSON.stringify(options)}`);
      
      // In a real implementation, this would call the Instagram Graph API or a scraping service
      // For demonstration, we'll simulate the API response with mock data
      
      // Parameters for API request
      const params: Record<string, any> = {
        api_key: this.apiKey,
        limit: options.limit || 25,
      };
      
      if (options.niche && options.niche.length > 0) {
        params.niche = options.niche[0];
      }
      
      if (options.industry && options.industry.length > 0) {
        params.category = options.industry[0];
      }
      
      if (options.location && options.location.length > 0) {
        params.location = options.location[0];
      }
      
      // Mock response - in real implementation, this would be replaced with API call
      // const response = await axios.get(`${this.apiUrl}/search`, { params });
      // const profiles = response.data.profiles;
      
      // Mock data for demonstration
      const mockProfiles = this.getMockProfiles(params);
      
      // Process and convert to leads
      const leads: Lead[] = [];
      for (const profile of mockProfiles) {
        const conversionPotential = this.calculateConversionPotential(profile, options);
        
        // Only include leads that meet the minimum score requirement
        const leadScore = Math.round((profile.followersCount > 1000 ? 75 : 60) + (conversionPotential * 25));
        if (!options.minScore || leadScore >= options.minScore) {
          leads.push(this.mapToLead(profile, conversionPotential));
        }
      }
      
      logger.info(`Found ${leads.length} leads from Instagram`);
      return leads;
      
    } catch (error) {
      logger.error('Error fetching leads from Instagram:', error);
      throw new Error('Failed to fetch leads from Instagram. Please try again later.');
    }
  }
  
  /**
   * Generate mock Instagram profiles for demonstration
   */
  private getMockProfiles(params: Record<string, any>): InstagramProfile[] {
    // Base profile templates
    const baseProfiles: InstagramProfile[] = [
      {
        id: '123456789',
        username: 'fashion_store_official',
        fullName: 'Fashion Store',
        businessEmail: 'contact@fashionstore.com',
        bio: 'Your one-stop fashion destination. Quality clothing and accessories. Worldwide shipping. #fashion #style #clothing',
        followersCount: 24500,
        followingCount: 850,
        engagement: 2200,
        postCount: 420,
        category: 'Clothing Store',
        location: 'New York, USA',
        isVerified: true,
        isBusinessAccount: true,
        businessCategory: 'Retail',
        recentPosts: []
      },
      {
        id: '987654321',
        username: 'tech_gadgets_hub',
        fullName: 'Tech Gadgets Hub',
        businessEmail: 'info@techgadgetshub.com',
        bio: 'Latest tech gadgets and accessories. Reviews and deals. #tech #gadgets #electronics #innovation',
        followersCount: 18700,
        followingCount: 720,
        engagement: 1500,
        postCount: 350,
        category: 'Electronics Store',
        location: 'San Francisco, USA',
        isVerified: false,
        isBusinessAccount: true,
        businessCategory: 'Electronics',
        recentPosts: []
      },
      {
        id: '456789123',
        username: 'beauty_essentials',
        fullName: 'Beauty Essentials',
        businessEmail: 'hello@beautyessentials.com',
        bio: 'Premium beauty products for a radiant you. Skincare, makeup and more. #beauty #skincare #makeup #cosmetics',
        followersCount: 32000,
        followingCount: 450,
        engagement: 3500,
        postCount: 520,
        category: 'Cosmetics Store',
        location: 'Los Angeles, USA',
        isVerified: true,
        isBusinessAccount: true,
        businessCategory: 'Beauty & Cosmetics',
        recentPosts: []
      },
      {
        id: '789123456',
        username: 'home_decor_ideas',
        fullName: 'Home Decor Ideas',
        businessEmail: 'contact@homedecor.com',
        bio: 'Transform your space with our curated home decor collections. #homedecor #interior #furniture #homestyle',
        followersCount: 28300,
        followingCount: 610,
        engagement: 2700,
        postCount: 380,
        category: 'Home Goods Store',
        location: 'Chicago, USA',
        isVerified: false,
        isBusinessAccount: true,
        businessCategory: 'Home & Garden',
        recentPosts: []
      },
      {
        id: '321654987',
        username: 'fitness_gear_pro',
        fullName: 'Fitness Gear Pro',
        businessEmail: 'support@fitnessgear.com',
        bio: 'Professional fitness equipment and apparel. For beginners and pros. #fitness #workout #gym #health',
        followersCount: 21500,
        followingCount: 390,
        engagement: 1900,
        postCount: 310,
        category: 'Sports & Fitness',
        location: 'Miami, USA',
        isVerified: false,
        isBusinessAccount: true,
        businessCategory: 'Fitness',
        recentPosts: []
      }
    ];
    
    // Generate mock recent posts for each profile
    baseProfiles.forEach(profile => {
      profile.recentPosts = this.generateMockPosts(profile, 5);
    });
    
    // Filter profiles based on parameters
    let profiles = [...baseProfiles];
    
    if (params.category) {
      profiles = profiles.filter(p => 
        p.businessCategory?.toLowerCase().includes(params.category.toLowerCase()) || 
        p.category?.toLowerCase().includes(params.category.toLowerCase())
      );
    }
    
    if (params.location) {
      profiles = profiles.filter(p => 
        p.location?.toLowerCase().includes(params.location.toLowerCase())
      );
    }
    
    if (params.niche) {
      const niche = params.niche.toLowerCase();
      profiles = profiles.filter(p => {
        // Check if niche is reflected in bio, business category, or recent posts
        const bioMatch = p.bio.toLowerCase().includes(niche);
        const categoryMatch = p.businessCategory?.toLowerCase().includes(niche) || p.category?.toLowerCase().includes(niche);
        const postsMatch = p.recentPosts.some(post => 
          post.caption.toLowerCase().includes(niche) || 
          post.hashtags.some(tag => tag.includes(niche))
        );
        
        return bioMatch || categoryMatch || postsMatch;
      });
    }
    
    // Apply limit (default to all if not specified)
    const limit = params.limit || profiles.length;
    
    return profiles.slice(0, limit);
  }
  
  /**
   * Generate mock posts for an Instagram profile
   */
  private generateMockPosts(profile: InstagramProfile, count: number): InstagramPost[] {
    const posts: InstagramPost[] = [];
    
    // Generate hashtags based on profile category
    const getHashtags = (): string[] => {
      const baseHashtags = ['instagram', 'instagood', 'photooftheday'];
      const categoryHashtags: Record<string, string[]> = {
        'Retail': ['fashion', 'style', 'clothing', 'outfit', 'shopping'],
        'Electronics': ['tech', 'gadgets', 'technology', 'innovation', 'devices'],
        'Beauty & Cosmetics': ['beauty', 'makeup', 'skincare', 'cosmetics', 'beautytips'],
        'Home & Garden': ['home', 'homedecor', 'interior', 'homestyle', 'furniture'],
        'Fitness': ['fitness', 'workout', 'gym', 'exercise', 'fitnessmotivation']
      };
      
      // Add category-specific hashtags if available
      const specificHashtags = profile.businessCategory ? 
        categoryHashtags[profile.businessCategory] || [] : [];
      
      return [...baseHashtags, ...specificHashtags].slice(0, 5 + Math.floor(Math.random() * 5));
    };
    
    // Generate captions based on profile type
    const getCaption = (index: number): string => {
      const captions = [
        `Check out our latest products! Perfect for any ${profile.businessCategory?.toLowerCase() || 'style'}.`,
        `New arrivals just dropped! Limited stock available.`,
        `Customer favorite! Shop now before it's gone.`,
        `Special offer this week only! Use code INSTA20 for 20% off.`,
        `Behind the scenes look at our newest collection.`,
        `As seen on @influencer - now available in our store!`
      ];
      
      return captions[index % captions.length];
    };
    
    // Generate mentioned accounts
    const getMentionedAccounts = (): string[] => {
      const possibleMentions = ['shopify', 'instagram', 'influencer_name', 'partner_brand'];
      const count = Math.floor(Math.random() * 3);
      const mentions = [];
      
      for (let i = 0; i < count; i++) {
        mentions.push(possibleMentions[Math.floor(Math.random() * possibleMentions.length)]);
      }
      
      return mentions;
    };
    
    // Generate posts
    for (let i = 0; i < count; i++) {
      const postId = `post-${profile.id}-${i}`;
      const shortcode = `BQ${Math.random().toString(36).substring(2, 10)}`;
      const timestamp = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(); // Each post is ~1 week apart
      
      posts.push({
        id: postId,
        shortcode,
        caption: getCaption(i),
        likeCount: Math.floor(profile.followersCount * (0.05 + Math.random() * 0.15)),
        commentCount: Math.floor(profile.followersCount * (0.01 + Math.random() * 0.05)),
        timestamp,
        hashtags: getHashtags(),
        mentionedAccounts: getMentionedAccounts()
      });
    }
    
    return posts;
  }
}

// Export an instance of the Instagram source adapter
export const instagramSourceAdapter = new InstagramSourceAdapter(
  process.env.INSTAGRAM_API_KEY || 'test_api_key'
); 