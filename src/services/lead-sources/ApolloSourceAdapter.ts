import { apolloService } from '@/services/apollo';
import { Lead, LeadSource } from '@/models/LeadTypes';
import { LeadSourceAdapter } from './LeadSourceAdapter';
import { leadDatabaseService } from '../LeadDatabaseService';

export class ApolloSourceAdapter implements LeadSourceAdapter {
  source: LeadSource = 'apollo';
  
  // Apollo scores tend to be B2B focused, we need to adjust for dropshipping
  private adjustScoreForDropshipping(score: number, industry?: string): number {
    // Higher scores for industries related to dropshipping
    const dropshippingMultiplier: { [key: string]: number } = {
      'Retail': 1.5,
      'E-commerce': 1.8,
      'Consumer Goods': 1.6,
      'Fashion': 1.7,
      'Apparel': 1.7,
      'Luxury': 1.3,
      'Home Decor': 1.4,
      'Furniture': 1.3,
      'Electronics': 1.6,
      'Health': 1.5,
      'Beauty': 1.7,
      'Fitness': 1.5,
      'Sports': 1.4,
      'Outdoor': 1.5,
      'Pet': 1.6,
      'Jewelry': 1.5,
      'Accessories': 1.5
    };
    
    const multiplier = industry && dropshippingMultiplier[industry]
      ? dropshippingMultiplier[industry]
      : 1.0;
      
    return score * multiplier;
  }
  
  // Calculate conversion potential based on Apollo data and industry
  private calculateConversionPotential(contact: any): number {
    // Base conversion potential factors
    let potential = 0.1; // Starting point
    
    // Factors that might increase conversion in dropshipping
    if (contact.email_verified) potential += 0.2;
    if (contact.title && contact.title.toLowerCase().includes('buyer')) potential += 0.15;
    if (contact.title && contact.title.toLowerCase().includes('purchase')) potential += 0.15;
    if (contact.title && contact.title.toLowerCase().includes('consumer')) potential += 0.1;
    if (contact.industry && ['retail', 'ecommerce', 'fashion', 'consumer'].some(i => contact.industry.toLowerCase().includes(i))) {
      potential += 0.2;
    }
    
    // Last active is recent
    if (contact.last_activity_date) {
      const lastActive = new Date(contact.last_activity_date);
      const now = new Date();
      const daysSinceLastActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActive < 30) potential += 0.15;
      else if (daysSinceLastActive < 90) potential += 0.05;
    }
    
    // Engage rate from Apollo if available
    if (contact.engagement_rate) {
      potential += contact.engagement_rate / 100 * 0.3; // Scale it to add up to 0.3
    }
    
    return Math.min(potential, 0.95); // Cap at 0.95 (95%)
  }
  
  // Convert Apollo contact to our lead format
  private mapContactToLead(contact: any): Omit<Lead, 'id'> {
    const score = contact.apollo_score || 60;
    const adjustedScore = this.adjustScoreForDropshipping(score, contact.industry);
    
    return {
      firstName: contact.first_name || '',
      lastName: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      company: contact.organization?.name || '',
      industry: contact.industry || '',
      location: contact.location?.country || '',
      niche: contact.niche || '',
      source: this.source,
      score: adjustedScore,
      conversionPotential: this.calculateConversionPotential(contact),
      interests: contact.keywords || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEnriched: new Date().toISOString(),
      engagementRate: contact.engagement_rate || 0,
      verified: contact.email_verified || false
    };
  }
  
  // Fetch leads from Apollo based on criteria
  async fetchLeads(criteria: {
    niche?: string,
    industry?: string[],
    title?: string[],
    location?: string[],
    limit?: number
  }): Promise<Lead[]> {
    try {
      // Use the existing Apollo service to fetch contacts
      const contacts = await apolloService.searchContacts({
        industry: criteria.industry || [],
        title: criteria.title || [],
        limit: criteria.limit || 100
      });
      
      // Map Apollo contacts to our lead format
      const leads = contacts.map(contact => this.mapContactToLead(contact));
      
      // Track API usage
      const apiKey = process.env.APOLLO_API_KEY || '';
      await leadDatabaseService.trackApiUsage(this.source, contacts.length, apiKey);
      
      return leads;
    } catch (error) {
      console.error('Error fetching leads from Apollo:', error);
      throw new Error('Failed to fetch leads from Apollo');
    }
  }
  
  // Additional method to enrich leads with more details from Apollo
  async enrichLead(email: string): Promise<Partial<Lead>> {
    try {
      const enrichedContact = await apolloService.enrichContact(email);
      
      if (!enrichedContact) {
        throw new Error(`No data found for email: ${email}`);
      }
      
      // Track API usage (assuming 1 credit per enrichment)
      const apiKey = process.env.APOLLO_API_KEY || '';
      await leadDatabaseService.trackApiUsage(this.source, 1, apiKey);
      
      return this.mapContactToLead(enrichedContact);
    } catch (error) {
      console.error('Error enriching lead from Apollo:', error);
      throw new Error('Failed to enrich lead from Apollo');
    }
  }
  
  // Method to verify an email through Apollo
  async verifyEmail(email: string): Promise<{ isValid: boolean; confidence: string; }> {
    try {
      const verification = await apolloService.verifyEmail(email);
      
      // Track API usage (assuming 1 credit per verification)
      const apiKey = process.env.APOLLO_API_KEY || '';
      await leadDatabaseService.trackApiUsage(this.source, 1, apiKey);
      
      return verification;
    } catch (error) {
      console.error('Error verifying email through Apollo:', error);
      throw new Error('Failed to verify email through Apollo');
    }
  }
}

// Export an instance of the adapter
export const apolloSourceAdapter = new ApolloSourceAdapter(); 