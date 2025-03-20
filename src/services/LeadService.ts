import { Lead, LeadSource, LeadStats, LeadSourceConfig } from '@/models/LeadTypes';
import { leadDatabaseService } from './LeadDatabaseService';
import { apolloSourceAdapter } from './lead-sources/ApolloSourceAdapter';
import { facebookSourceAdapter } from './lead-sources/FacebookSourceAdapter';
import { tiktokSourceAdapter } from './lead-sources/TikTokSourceAdapter';
import { instagramSourceAdapter } from './lead-sources/InstagramSourceAdapter';
import { googleSourceAdapter } from './lead-sources/GoogleSourceAdapter';
import { LeadSourceAdapter } from './lead-sources/LeadSourceAdapter';

// Define lead packs for the new pricing model
export interface LeadPack {
  name: string;
  id: string;
  leads: number;
  price: number;
  popular?: boolean;
  description: string;
}

export const leadPacks: LeadPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    leads: 500,
    price: 29,
    description: 'Perfect for small businesses just getting started with email marketing.'
  },
  {
    id: 'growth',
    name: 'Growth',
    leads: 2000,
    price: 49,
    popular: true,
    description: 'Ideal for growing businesses looking to expand their reach.'
  },
  {
    id: 'pro',
    name: 'Professional',
    leads: 5000,
    price: 99,
    description: 'For established businesses with high-volume email marketing needs.'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    leads: 10000,
    price: 199,
    description: 'Comprehensive solution for large-scale businesses and enterprises.'
  }
];

// Function to return lead packs
export const getLeadPacks = () => leadPacks;

export interface LeadFetchOptions {
  niche?: string;
  industry?: string[];
  location?: string[];
  title?: string[];
  limit?: number;
  minScore?: number;
  sources?: LeadSource[];
  includeSocialProfiles?: boolean;
  includePhoneNumbers?: boolean;
  extraSourceParams?: Record<LeadSource, any>;
}

export class LeadService {
  private sourceAdapters: Map<LeadSource, LeadSourceAdapter> = new Map();
  
  constructor() {
    // Register source adapters
    this.sourceAdapters.set('apollo', apolloSourceAdapter);
    this.sourceAdapters.set('facebook', facebookSourceAdapter);
    this.sourceAdapters.set('tiktok', tiktokSourceAdapter);
    this.sourceAdapters.set('instagram', instagramSourceAdapter);
    this.sourceAdapters.set('google', googleSourceAdapter);
  }
  
  // Get leads from the database based on criteria
  async getLeads(options: LeadFetchOptions): Promise<Lead[]> {
    try {
      console.log('Fetching leads from database with options:', options);
      
      // Try to get leads from the database first
      const leads = await leadDatabaseService.getLeads({
        niche: options.niche,
        industry: options.industry,
        location: options.location,
        source: options.sources,
        minScore: options.minScore,
        limit: options.limit
      });
      
      // If we found enough leads, return them
      if (leads.length >= (options.limit || 10)) {
        console.log(`Found ${leads.length} leads in the database`);
        return leads;
      }
      
      // If not enough leads in the database, fetch from API sources
      if (leads.length < (options.limit || 10)) {
        console.log(`Only found ${leads.length} leads in database, fetching more from APIs`);
        
        const additionalLeads = await this.fetchLeadsFromSources({
          ...options,
          limit: (options.limit || 10) - leads.length
        });
        
        if (additionalLeads.length > 0) {
          // Store the new leads in the database for future use
          await leadDatabaseService.storeLeads(additionalLeads);
          
          // Combine the leads from database and APIs
          return [...leads, ...additionalLeads.map(lead => ({
            ...lead,
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }))];
        }
      }
      
      return leads;
    } catch (error) {
      console.error('Error getting leads:', error);
      throw new Error('Failed to get leads');
    }
  }
  
  // Method to fetch leads from multiple sources
  private async fetchLeadsFromSources(options: LeadFetchOptions): Promise<Omit<Lead, 'id'>[]> {
    try {
      // Get active lead sources
      const activeSources = await leadDatabaseService.getActiveLeadSources();
      
      // Filter sources based on options
      const sourcesToUse = options.sources 
        ? activeSources.filter(s => options.sources?.includes(s.source))
        : activeSources;
      
      // Sort sources by priority (higher first)
      sourcesToUse.sort((a, b) => b.fetchPriority - a.fetchPriority);
      
      // Calculate leads to fetch from each source
      const totalLeadsNeeded = options.limit || 50;
      const sourcesCount = sourcesToUse.length;
      
      if (sourcesCount === 0) {
        console.log('No active lead sources available');
        return [];
      }
      
      // Distribute the lead limit among sources based on priority
      const prioritySum = sourcesToUse.reduce((sum, source) => sum + source.fetchPriority, 0);
      
      const sourcelimits = sourcesToUse.map(source => {
        const priorityRatio = source.fetchPriority / prioritySum;
        return {
          source: source.source,
          limit: Math.max(5, Math.round(totalLeadsNeeded * priorityRatio))
        };
      });
      
      // Fetch leads from each source concurrently
      const fetchPromises = sourcelimits.map(async ({ source, limit }) => {
        const adapter = this.sourceAdapters.get(source);
        
        if (!adapter) {
          console.warn(`No adapter found for source: ${source}`);
          return [];
        }
        
        try {
          // Get source-specific parameters
          const sourceParams = options.extraSourceParams?.[source] || {};
          
          // Fetch leads from this source
          const leads = await adapter.fetchLeads({
            niche: options.niche,
            industry: options.industry,
            location: options.location,
            title: options.title,
            limit,
            ...sourceParams
          });
          
          return leads.map(lead => ({
            ...lead,
            source: source
          }));
        } catch (error) {
          console.error(`Error fetching leads from ${source}:`, error);
          return [];
        }
      });
      
      // Wait for all sources to complete
      const results = await Promise.all(fetchPromises);
      
      // Flatten the results
      return results.flat();
    } catch (error) {
      console.error('Error fetching leads from sources:', error);
      throw new Error('Failed to fetch leads from sources');
    }
  }
  
  // Method to handle daily fetch from all sources (for cron job)
  async dailyLeadFetch(): Promise<{ totalFetched: number, bySource: Record<LeadSource, number> }> {
    try {
      console.log('Starting daily lead fetch...');
      
      // Get all active lead source configurations
      const activeSources = await leadDatabaseService.getActiveLeadSources();
      
      // Results tracker
      const results: Record<LeadSource, number> = {
        apollo: 0,
        facebook: 0,
        tiktok: 0,
        instagram: 0,
        google: 0
      };
      
      // Fetch from each source
      for (const sourceConfig of activeSources) {
        try {
          const adapter = this.sourceAdapters.get(sourceConfig.source);
          
          if (!adapter) {
            console.warn(`No adapter found for source: ${sourceConfig.source}`);
            continue;
          }
          
          // Skip if daily limit reached
          if (sourceConfig.creditsUsedToday && sourceConfig.creditsUsedToday >= sourceConfig.dailyLimit) {
            console.log(`Daily limit reached for ${sourceConfig.source}, skipping`);
            continue;
          }
          
          // Calculate how many leads we can fetch
          const remainingCredits = sourceConfig.dailyLimit - (sourceConfig.creditsUsedToday || 0);
          const fetchLimit = Math.min(remainingCredits, 200); // Cap at 200 per source per day
          
          // Skip if no credits left
          if (fetchLimit <= 0) continue;
          
          // Get niches to target
          const targetNiches = sourceConfig.targetNiches || [];
          
          // If no specific niches, do one general fetch
          if (targetNiches.length === 0) {
            const leads = await adapter.fetchLeads({
              limit: fetchLimit,
              ...sourceConfig.fetchCriteria
            });
            
            if (leads.length > 0) {
              // Store the leads
              await leadDatabaseService.storeLeads(leads);
              results[sourceConfig.source] += leads.length;
            }
          } else {
            // Otherwise, fetch for each niche
            const leadsPerNiche = Math.floor(fetchLimit / targetNiches.length);
            
            for (const niche of targetNiches) {
              const leads = await adapter.fetchLeads({
                niche,
                limit: leadsPerNiche,
                ...sourceConfig.fetchCriteria
              });
              
              if (leads.length > 0) {
                // Store the leads
                await leadDatabaseService.storeLeads(leads);
                results[sourceConfig.source] += leads.length;
              }
            }
          }
        } catch (error) {
          console.error(`Error in daily fetch for ${sourceConfig.source}:`, error);
        }
      }
      
      const totalFetched = Object.values(results).reduce((sum, count) => sum + count, 0);
      console.log(`Daily lead fetch complete. Total: ${totalFetched} leads`);
      
      return {
        totalFetched,
        bySource: results
      };
    } catch (error) {
      console.error('Error in daily lead fetch:', error);
      throw new Error('Failed to complete daily lead fetch');
    }
  }
  
  // Get lead statistics
  async getLeadStats(): Promise<LeadStats> {
    return leadDatabaseService.getLeadStats();
  }
  
  // Update lead source configuration
  async updateLeadSource(config: LeadSourceConfig): Promise<void> {
    return leadDatabaseService.updateLeadSourceConfig(config);
  }
  
  // Get all active lead sources
  async getActiveLeadSources(): Promise<LeadSourceConfig[]> {
    return leadDatabaseService.getActiveLeadSources();
  }
}

export const leadService = new LeadService(); 