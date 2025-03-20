import axios from 'axios';
import { Lead, LeadSource, LeadSourceAdapter, LeadFetchOptions } from '@/models/LeadTypes';
import { logger } from '@/utils/logger';

// Interface for Google business data
interface GoogleBusiness {
  id: string;
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  category: string;
  rating: number;
  reviewCount: number;
  locality?: string;
  region?: string;
  country?: string;
  placeId: string;
  hasWebsite: boolean;
  attributes?: string[];
}

/**
 * Google Source Adapter for fetching high-converting leads from Google search and Google Maps
 */
export class GoogleSourceAdapter implements LeadSourceAdapter {
  private apiKey: string;
  private apiUrl: string = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Calculate the conversion potential of a Google business based on various factors
   */
  private calculateConversionPotential(business: GoogleBusiness, options: LeadFetchOptions): number {
    // Base score
    let score = 0;

    // Rating score (0-5 stars)
    const ratingScore = (business.rating / 5) * 0.25;
    
    // Review count (more reviews = more established business)
    const reviewScore = Math.min(business.reviewCount / 100, 1) * 0.2;
    
    // Website presence is important for online business
    const websiteScore = business.hasWebsite ? 0.15 : 0;
    
    // Relevance to search criteria
    let relevanceScore = 0;
    if (options.industry && options.industry.length > 0) {
      // Check if business category matches requested industry
      const category = business.category.toLowerCase();
      const matchingIndustry = options.industry.some(industry => 
        category.includes(industry.toLowerCase())
      );
      
      if (matchingIndustry) {
        relevanceScore += 0.2;
      }
    }
    
    // Location relevance
    let locationScore = 0;
    if (options.location && options.location.length > 0 && business.locality) {
      const businessLocation = 
        `${business.locality} ${business.region || ''} ${business.country || ''}`.toLowerCase();
        
      const matchingLocation = options.location.some(location => 
        businessLocation.includes(location.toLowerCase())
      );
      
      if (matchingLocation) {
        locationScore += 0.2;
      }
    }
    
    // Combine all scores
    score = ratingScore + reviewScore + websiteScore + relevanceScore + locationScore;
    
    // Normalize to 0-1 range
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Map Google business data to our Lead model
   */
  private mapToLead(business: GoogleBusiness, conversionPotential: number): Lead {
    // Extract a potential first/last name from business name
    // This is an approximation as many business names don't represent a person
    let firstName = 'Business';
    let lastName = 'Owner';
    
    if (business.name.includes(' ')) {
      const nameParts = business.name.split(' ');
      if (nameParts.length >= 2 && !business.name.endsWith('LLC') && !business.name.endsWith('Inc')) {
        if (nameParts.length === 2) {
          // If there are exactly two parts, treat as first and last name
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else {
          // For longer names, take first part as first name and the rest as last name
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }
    }

    return {
      id: `google-${business.id}`,
      firstName,
      lastName,
      email: business.email || `contact@${business.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || 'example.com'}`,
      source: 'google' as LeadSource,
      score: Math.round(60 + (conversionPotential * 40)),
      conversionPotential,
      company: business.name,
      phone: business.phone,
      location: [business.locality, business.region, business.country].filter(Boolean).join(', '),
      socialProfiles: {
        website: business.website
      },
      title: 'Business Owner',
      industry: business.category,
      lastActivity: new Date().toISOString(),
      notes: `Google Maps business with ${business.reviewCount} reviews and a ${business.rating}/5 rating.`,
      tags: ['google', 'maps', business.category.toLowerCase().replace(/\s+/g, '-')],
      dateAdded: new Date().toISOString()
    };
  }

  /**
   * Fetch leads from Google based on specified options
   */
  async fetchLeads(options: LeadFetchOptions): Promise<Lead[]> {
    try {
      logger.info(`Fetching leads from Google with options: ${JSON.stringify(options)}`);
      
      // In a real implementation, this would call the Google Places API
      // For demonstration, we'll simulate the API response with mock data
      
      // Parameters for API request
      const params: Record<string, any> = {
        key: this.apiKey,
        limit: options.limit || 25,
      };
      
      if (options.industry && options.industry.length > 0) {
        params.type = options.industry[0];
      }
      
      if (options.location && options.location.length > 0) {
        params.location = options.location[0];
      }
      
      if (options.niche && options.niche.length > 0) {
        params.keyword = options.niche[0];
      }
      
      // Mock response - in real implementation, this would be replaced with API call
      // const response = await axios.get(`${this.apiUrl}/place/textsearch/json`, { params });
      // const businesses = response.data.results;
      
      // Mock data for demonstration
      const mockBusinesses = this.getMockBusinesses(params);
      
      // Process and convert to leads
      const leads: Lead[] = [];
      for (const business of mockBusinesses) {
        const conversionPotential = this.calculateConversionPotential(business, options);
        
        // Only include leads that meet the minimum score requirement
        const leadScore = Math.round(60 + (conversionPotential * 40));
        if (!options.minScore || leadScore >= options.minScore) {
          leads.push(this.mapToLead(business, conversionPotential));
        }
      }
      
      logger.info(`Found ${leads.length} leads from Google`);
      return leads;
      
    } catch (error) {
      logger.error('Error fetching leads from Google:', error);
      throw new Error('Failed to fetch leads from Google. Please try again later.');
    }
  }
  
  /**
   * Generate mock Google businesses for demonstration
   */
  private getMockBusinesses(params: Record<string, any>): GoogleBusiness[] {
    // Base business templates for different industries
    const baseBusinesses: GoogleBusiness[] = [
      {
        id: '1234567890',
        name: 'Urban Fashion Boutique',
        website: 'https://www.urbanfashion.com',
        email: 'contact@urbanfashion.com',
        phone: '+1 (212) 555-1234',
        address: '123 Fashion Ave',
        category: 'Clothing Store',
        rating: 4.7,
        reviewCount: 132,
        locality: 'New York',
        region: 'NY',
        country: 'USA',
        placeId: 'ChIJA123456789',
        hasWebsite: true,
        attributes: ['women_clothes', 'men_clothes', 'accessories']
      },
      {
        id: '2345678901',
        name: 'Tech Haven',
        website: 'https://www.techhaven.com',
        email: 'info@techhaven.com',
        phone: '+1 (415) 555-2345',
        address: '456 Tech Blvd',
        category: 'Electronics Store',
        rating: 4.5,
        reviewCount: 89,
        locality: 'San Francisco',
        region: 'CA',
        country: 'USA',
        placeId: 'ChIJB234567890',
        hasWebsite: true,
        attributes: ['electronics', 'computers', 'phones', 'gadgets']
      },
      {
        id: '3456789012',
        name: 'Glow Beauty Supply',
        website: 'https://www.glowbeauty.com',
        email: 'hello@glowbeauty.com',
        phone: '+1 (323) 555-3456',
        address: '789 Beauty Rd',
        category: 'Beauty Supply Store',
        rating: 4.8,
        reviewCount: 156,
        locality: 'Los Angeles',
        region: 'CA',
        country: 'USA',
        placeId: 'ChIJC345678901',
        hasWebsite: true,
        attributes: ['skincare', 'makeup', 'haircare']
      },
      {
        id: '4567890123',
        name: 'Cozy Home Decor',
        website: 'https://www.cozyhome.com',
        email: 'support@cozyhome.com',
        phone: '+1 (312) 555-4567',
        address: '101 Decor St',
        category: 'Home Goods Store',
        rating: 4.6,
        reviewCount: 112,
        locality: 'Chicago',
        region: 'IL',
        country: 'USA',
        placeId: 'ChIJD456789012',
        hasWebsite: true,
        attributes: ['furniture', 'decor', 'homeware']
      },
      {
        id: '5678901234',
        name: 'Peak Fitness Gear',
        website: 'https://www.peakfitness.com',
        email: 'info@peakfitness.com',
        phone: '+1 (305) 555-5678',
        address: '202 Fitness Ave',
        category: 'Sporting Goods Store',
        rating: 4.4,
        reviewCount: 78,
        locality: 'Miami',
        region: 'FL',
        country: 'USA',
        placeId: 'ChIJE567890123',
        hasWebsite: true,
        attributes: ['fitness', 'sports', 'workout', 'apparel']
      },
      {
        id: '6789012345',
        name: 'Byte Digital Solutions',
        website: 'https://www.bytedigital.com',
        email: 'contact@bytedigital.com',
        phone: '+1 (206) 555-6789',
        address: '303 Digital Dr',
        category: 'Computer Store',
        rating: 4.9,
        reviewCount: 201,
        locality: 'Seattle',
        region: 'WA',
        country: 'USA',
        placeId: 'ChIJF678901234',
        hasWebsite: true,
        attributes: ['computers', 'software', 'repair', 'accessories']
      },
      {
        id: '7890123456',
        name: 'Bright Kitchen Supplies',
        website: 'https://www.brightkitchen.com',
        email: 'hello@brightkitchen.com',
        phone: '+1 (303) 555-7890',
        address: '404 Culinary Ln',
        category: 'Kitchen Supply Store',
        rating: 4.3,
        reviewCount: 67,
        locality: 'Denver',
        region: 'CO',
        country: 'USA',
        placeId: 'ChIJG789012345',
        hasWebsite: true,
        attributes: ['cookware', 'appliances', 'utensils']
      },
      {
        id: '8901234567',
        name: 'Paws Pet Supplies',
        website: 'https://www.pawspets.com',
        email: 'woof@pawspets.com',
        phone: '+1 (512) 555-8901',
        address: '505 Pet Path',
        category: 'Pet Store',
        rating: 4.7,
        reviewCount: 143,
        locality: 'Austin',
        region: 'TX',
        country: 'USA',
        placeId: 'ChIJH890123456',
        hasWebsite: true,
        attributes: ['pet_food', 'pet_supplies', 'accessories']
      },
      {
        id: '9012345678',
        name: 'Toy Box',
        website: 'https://www.toybox.com',
        email: 'fun@toybox.com',
        phone: '+1 (617) 555-9012',
        address: '606 Play Plz',
        category: 'Toy Store',
        rating: 4.8,
        reviewCount: 98,
        locality: 'Boston',
        region: 'MA',
        country: 'USA',
        placeId: 'ChIJI901234567',
        hasWebsite: true,
        attributes: ['toys', 'games', 'educational', 'children']
      },
      {
        id: '0123456789',
        name: 'Green Thumb Garden Center',
        website: 'https://www.greenthumb.com',
        email: 'grow@greenthumb.com',
        phone: '+1 (503) 555-0123',
        address: '707 Garden Way',
        category: 'Garden Center',
        rating: 4.5,
        reviewCount: 87,
        locality: 'Portland',
        region: 'OR',
        country: 'USA',
        placeId: 'ChIJJ012345678',
        hasWebsite: true,
        attributes: ['plants', 'gardening', 'outdoor', 'tools']
      }
    ];
    
    // Filter businesses based on parameters
    let businesses = [...baseBusinesses];
    
    if (params.type) {
      businesses = businesses.filter(b => 
        b.category.toLowerCase().includes(params.type.toLowerCase())
      );
    }
    
    if (params.location) {
      businesses = businesses.filter(b => {
        const businessLocation = 
          `${b.locality} ${b.region} ${b.country}`.toLowerCase();
        return businessLocation.includes(params.location.toLowerCase());
      });
    }
    
    if (params.keyword) {
      businesses = businesses.filter(b => {
        const businessKeywords = [
          b.name, 
          b.category, 
          ...(b.attributes || [])
        ].join(' ').toLowerCase();
        
        return businessKeywords.includes(params.keyword.toLowerCase());
      });
    }
    
    // Apply limit (default to all if not specified)
    const limit = params.limit || businesses.length;
    
    return businesses.slice(0, limit);
  }
}

// Export an instance of the Google source adapter
export const googleSourceAdapter = new GoogleSourceAdapter(
  process.env.GOOGLE_PLACES_API_KEY || 'test_api_key'
); 