import { Lead, LeadSource } from '@/models/LeadTypes';
import { LeadSourceAdapter } from './LeadSourceAdapter';
import { leadDatabaseService } from '../LeadDatabaseService';
import axios from 'axios';

export class FacebookSourceAdapter implements LeadSourceAdapter {
  source: LeadSource = 'facebook';
  private apiUrl = 'https://graph.facebook.com/v17.0';
  
  // Calculate conversion potential based on Facebook engagement data
  private calculateConversionPotential(data: any): number {
    // Base conversion potential
    let potential = 0.2; // Facebook leads start with higher base potential for dropshipping
    
    // Factors that indicate higher conversion potential in dropshipping context
    if (data.interests && data.interests.length > 0) {
      // Check for e-commerce/shopping interests
      const shoppingInterests = data.interests.filter((interest: string) => 
        ['shopping', 'online shopping', 'e-commerce', 'retail', 'fashion', 'products'].some(
          keyword => interest.toLowerCase().includes(keyword)
        )
      );
      
      potential += Math.min(shoppingInterests.length * 0.1, 0.3); // Up to 0.3 extra
    }
    
    // Recent activity score
    if (data.last_activity_days) {
      if (data.last_activity_days < 7) potential += 0.2;
      else if (data.last_activity_days < 30) potential += 0.1;
    }
    
    // Engagement metrics
    if (data.engagement_score) {
      potential += data.engagement_score * 0.2; // Assuming score is 0-1
    }
    
    return Math.min(potential, 0.95); // Cap at 0.95 (95%)
  }
  
  // Map Facebook data to our lead format
  private mapFacebookDataToLead(data: any): Omit<Lead, 'id'> {
    // Split name into first and last name
    const nameParts = (data.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Generate interests array
    const interests = data.interests || [];
    
    // Calculate conversion potential
    const conversionPotential = this.calculateConversionPotential(data);
    
    return {
      firstName,
      lastName,
      email: data.email || '',
      phone: data.phone || '',
      title: data.job_title || '',
      company: data.employer || '',
      industry: data.industry || '',
      location: data.location || '',
      niche: data.niche || '',
      source: this.source,
      score: data.lead_score || 75, // Facebook leads typically score higher for B2C
      conversionPotential,
      interests,
      tags: ['facebook', ...(data.tags || [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEnriched: new Date().toISOString(),
      socialProfiles: {
        facebook: data.profile_url || '',
        instagram: data.instagram_url || '',
        tiktok: data.tiktok_url || '',
        linkedin: data.linkedin_url || ''
      },
      verified: !!data.email, // Consider verified if email exists
      engagementRate: data.engagement_score || 0
    };
  }
  
  // Method to fetch leads from Facebook based on criteria
  async fetchLeads(criteria: {
    niche?: string,
    industry?: string[],
    interests?: string[],
    location?: string[],
    limit?: number,
    ageRange?: { min: number, max: number },
    gender?: string
  }): Promise<Lead[]> {
    try {
      // Get the API key from config
      const apiKey = process.env.FACEBOOK_API_KEY || '';
      if (!apiKey) {
        throw new Error('Facebook API key is not configured');
      }

      // NOTE: Normally, you would use the Facebook Marketing API or Graph API
      // This is a simplified version that would need to be replaced with actual API calls
      
      // For this example, we'll simulate a Facebook API response
      // In a real implementation, you would use the Facebook API client
      
      // Simulate API request with parameters
      const params = {
        interests: criteria.interests?.join(',') || '',
        locations: criteria.location?.join(',') || '',
        industry: criteria.industry?.join(',') || '',
        limit: criteria.limit || 50,
        age_min: criteria.ageRange?.min || 18,
        age_max: criteria.ageRange?.max || 65,
        gender: criteria.gender || 'all'
      };
      
      // This would be replaced with an actual API call
      // const response = await axios.get(`${this.apiUrl}/custom_audience`, {
      //   params,
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`
      //   }
      // });
      
      // Simulate a response for demonstration
      const mockResponse = {
        data: Array(criteria.limit || 25).fill(null).map((_, index) => ({
          id: `fb_lead_${Date.now()}_${index}`,
          name: `Mock User ${index}`,
          email: `mockuser${index}@example.com`,
          phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          job_title: ['Shopper', 'Consumer', 'Customer', 'Online Buyer'][Math.floor(Math.random() * 4)],
          employer: ['', 'Self-employed', 'Consumer'][Math.floor(Math.random() * 3)],
          location: criteria.location?.[0] || 'United States',
          interests: [
            'Online Shopping',
            'Fashion',
            'Home Decor',
            'Electronics',
            'Beauty Products'
          ].sort(() => 0.5 - Math.random()).slice(0, 3),
          engagement_score: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
          last_activity_days: Math.floor(Math.random() * 30),
          lead_score: Math.floor(Math.random() * 30) + 70 // 70-100
        }))
      };
      
      // Map the response data to our lead format
      const leads = mockResponse.data.map(item => this.mapFacebookDataToLead(item));
      
      // Track API usage
      await leadDatabaseService.trackApiUsage(this.source, leads.length, apiKey);
      
      return leads;
    } catch (error) {
      console.error('Error fetching leads from Facebook:', error);
      throw new Error('Failed to fetch leads from Facebook');
    }
  }
}

// Export an instance of the adapter
export const facebookSourceAdapter = new FacebookSourceAdapter(); 