import { Lead, LeadSource } from '@/models/LeadTypes';
import { LeadSourceAdapter } from './LeadSourceAdapter';
import { leadDatabaseService } from '../LeadDatabaseService';

export class TikTokSourceAdapter implements LeadSourceAdapter {
  source: LeadSource = 'tiktok';
  
  // Calculate conversion potential based on TikTok engagement data
  private calculateConversionPotential(data: any): number {
    // Base conversion potential - TikTok has high engagement, especially for dropshipping products
    let potential = 0.3; // Higher base potential compared to other sources
    
    // Factors that indicate higher conversion potential in dropshipping context
    if (data.engagement_rate && data.engagement_rate > 0.05) {
      potential += 0.2; // TikTok engagement rates above 5% are excellent
    } else if (data.engagement_rate && data.engagement_rate > 0.03) {
      potential += 0.1; // 3-5% is good
    }
    
    // Content interest alignment with dropshipping
    if (data.content_categories && data.content_categories.length > 0) {
      const relevantCategories = ['fashion', 'beauty', 'lifestyle', 'tech', 'home', 'products', 'shopping'];
      const matches = data.content_categories.filter((category: string) => {
        return relevantCategories.some(rel => category.toLowerCase().includes(rel));
      });
      
      potential += Math.min(matches.length * 0.1, 0.3); // Up to 0.3 extra
    }
    
    // Recent activity is very important for TikTok
    if (data.days_since_last_active < 3) {
      potential += 0.15; // Very recent activity indicates high current interest
    } else if (data.days_since_last_active < 7) {
      potential += 0.1;
    }
    
    return Math.min(potential, 0.95); // Cap at 0.95 (95%)
  }
  
  // Map TikTok data to our lead format
  private mapTikTokDataToLead(data: any): Omit<Lead, 'id'> {
    // Split name into first and last name if available
    const nameParts = (data.display_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Calculate conversion potential
    const conversionPotential = this.calculateConversionPotential(data);
    
    return {
      firstName,
      lastName,
      email: data.email || '',
      phone: data.phone || '',
      title: data.occupation || '',
      company: '',
      industry: data.primary_category || '',
      location: data.location || '',
      niche: data.niche || '',
      source: this.source,
      score: data.lead_score || 85, // TikTok leads score high for B2C dropshipping
      conversionPotential,
      interests: data.content_categories || [],
      tags: ['tiktok', 'high-intent', ...(data.tags || [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEnriched: new Date().toISOString(),
      socialProfiles: {
        tiktok: data.profile_url || '',
        instagram: data.instagram_url || '',
        facebook: data.facebook_url || '',
        linkedin: ''
      },
      engagementRate: data.engagement_rate || 0,
      verified: !!data.email
    };
  }
  
  // Method to fetch leads from TikTok based on criteria
  async fetchLeads(criteria: {
    niche?: string,
    industry?: string[],
    contentCategories?: string[],
    location?: string[],
    limit?: number,
    minFollowers?: number,
    maxFollowers?: number,
    ageRange?: { min: number, max: number }
  }): Promise<Lead[]> {
    try {
      // Get the API key from config
      const apiKey = process.env.TIKTOK_API_KEY || '';
      if (!apiKey) {
        throw new Error('TikTok API key is not configured');
      }

      // NOTE: In a real implementation, you would use the TikTok Marketing API
      // This is a simplified version that would need to be replaced with actual API calls
      
      // Simulate parameters for the API call
      const params = {
        content_categories: criteria.contentCategories?.join(',') || '',
        locations: criteria.location?.join(',') || '',
        min_followers: criteria.minFollowers || 0,
        max_followers: criteria.maxFollowers || 1000000,
        limit: criteria.limit || 50,
        age_min: criteria.ageRange?.min || 18,
        age_max: criteria.ageRange?.max || 65
      };
      
      // Simulate a response for demonstration
      const mockResponse = {
        data: Array(criteria.limit || 25).fill(null).map((_, index) => ({
          id: `tt_lead_${Date.now()}_${index}`,
          display_name: `TikTok User ${index}`,
          username: `tiktok_user_${index}`,
          email: `tiktoker${index}@example.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          profile_url: `https://tiktok.com/@tiktok_user_${index}`,
          followers: Math.floor(Math.random() * 10000) + 1000,
          engagement_rate: (Math.random() * 0.08 + 0.02).toFixed(4), // 2% to 10%
          occupation: ['Creator', 'Influencer', 'Student', 'Shopper'][Math.floor(Math.random() * 4)],
          primary_category: criteria.industry?.[0] || ['Fashion', 'Lifestyle', 'Beauty', 'Tech'][Math.floor(Math.random() * 4)],
          location: criteria.location?.[0] || 'United States',
          content_categories: [
            'Fashion Trends',
            'Product Reviews',
            'Unboxing Videos',
            'Shopping Hauls',
            'Makeup Tutorials'
          ].sort(() => 0.5 - Math.random()).slice(0, 3),
          days_since_last_active: Math.floor(Math.random() * 10),
          lead_score: Math.floor(Math.random() * 15) + 80 // 80-95
        }))
      };
      
      // Map the response data to our lead format
      const leads = mockResponse.data.map(item => this.mapTikTokDataToLead(item));
      
      // Track API usage
      await leadDatabaseService.trackApiUsage(this.source, leads.length, apiKey);
      
      return leads;
    } catch (error) {
      console.error('Error fetching leads from TikTok:', error);
      throw new Error('Failed to fetch leads from TikTok');
    }
  }
}

// Export an instance of the adapter
export const tiktokSourceAdapter = new TikTokSourceAdapter(); 