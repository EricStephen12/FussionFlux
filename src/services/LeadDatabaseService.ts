import { db } from '@/utils/firebase-client';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, setDoc, orderBy, limit } from 'firebase/firestore';
import { Lead, LeadBatch, LeadSource, LeadSourceConfig, LeadStats } from '@/models/LeadTypes';
import { debounce } from 'lodash';

class LeadDatabaseService {
  private leadsRef = collection(db, 'leads');
  private leadBatchesRef = collection(db, 'lead_batches');
  private leadSourcesRef = collection(db, 'lead_sources');
  private leadStatsRef = collection(db, 'lead_stats');

  // Cache mechanism to reduce database reads
  private leadCache: Map<string, Lead[]> = new Map();
  private cacheTTL = 15 * 60 * 1000; // 15 minutes in milliseconds
  private cacheTimestamps: Map<string, number> = new Map();

  // Function to store leads in the database
  async storeLeads(leads: Omit<Lead, 'id'>[], batchId?: string): Promise<string[]> {
    try {
      const batch = db.batch();
      const leadIds: string[] = [];
      
      // Create a batch entry if not provided
      if (!batchId) {
        const batchRef = await addDoc(this.leadBatchesRef, {
          source: leads[0]?.source || 'unknown',
          fetchDate: new Date().toISOString(),
          count: leads.length,
          status: 'completed'
        });
        batchId = batchRef.id;
      }
      
      // Add each lead to the batch
      for (const lead of leads) {
        const leadRef = doc(this.leadsRef);
        const leadData = {
          ...lead,
          createdAt: lead.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          batchId
        };
        
        batch.set(leadRef, leadData);
        leadIds.push(leadRef.id);
      }
      
      await batch.commit();
      
      // Invalidate cache
      this.clearCache();
      
      // Update lead statistics
      this.updateLeadStats(leads[0]?.source);
      
      return leadIds;
    } catch (error) {
      console.error('Error storing leads:', error);
      throw new Error('Failed to store leads in database');
    }
  }

  // Function to get leads based on criteria
  async getLeads(criteria: {
    niche?: string,
    industry?: string[],
    location?: string[],
    source?: LeadSource[],
    minScore?: number,
    limit?: number,
    offset?: number,
    tags?: string[]
  }): Promise<Lead[]> {
    try {
      // Generate cache key based on criteria
      const cacheKey = JSON.stringify(criteria);
      
      // Check if we have a valid cache entry
      if (this.leadCache.has(cacheKey)) {
        const timestamp = this.cacheTimestamps.get(cacheKey) || 0;
        if (Date.now() - timestamp < this.cacheTTL) {
          return this.leadCache.get(cacheKey) || [];
        }
      }
      
      let q = query(this.leadsRef);
      
      // Add query constraints based on criteria
      if (criteria.niche) {
        q = query(q, where('niche', '==', criteria.niche));
      }
      
      if (criteria.industry && criteria.industry.length > 0) {
        // For simplicity, we'll just use the first industry in the array
        // In a real system, you might want to use array-contains-any
        q = query(q, where('industry', '==', criteria.industry[0]));
      }
      
      if (criteria.location && criteria.location.length > 0) {
        // Same as with industry
        q = query(q, where('location', '==', criteria.location[0]));
      }
      
      if (criteria.source && criteria.source.length > 0) {
        q = query(q, where('source', 'in', criteria.source));
      }
      
      if (criteria.minScore) {
        q = query(q, where('score', '>=', criteria.minScore));
      }
      
      // Add sorting and limiting
      q = query(q, orderBy('score', 'desc'));
      
      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }
      
      const snapshot = await getDocs(q);
      const leads: Lead[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Lead, 'id'>;
        leads.push({
          id: doc.id,
          ...data
        } as Lead);
      });
      
      // Store in cache
      this.leadCache.set(cacheKey, leads);
      this.cacheTimestamps.set(cacheKey, Date.now());
      
      return leads;
    } catch (error) {
      console.error('Error getting leads:', error);
      throw new Error('Failed to fetch leads from database');
    }
  }

  // Function to update lead source configuration
  async updateLeadSourceConfig(config: LeadSourceConfig): Promise<void> {
    try {
      const docRef = doc(this.leadSourcesRef, config.id);
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating lead source config:', error);
      throw new Error('Failed to update lead source configuration');
    }
  }

  // Function to get lead source configuration
  async getLeadSourceConfig(source: LeadSource): Promise<LeadSourceConfig | null> {
    try {
      const q = query(this.leadSourcesRef, where('source', '==', source), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as LeadSourceConfig;
    } catch (error) {
      console.error('Error getting lead source config:', error);
      throw new Error('Failed to get lead source configuration');
    }
  }

  // Function to get all active lead source configurations
  async getActiveLeadSources(): Promise<LeadSourceConfig[]> {
    try {
      const q = query(this.leadSourcesRef, where('active', '==', true));
      const snapshot = await getDocs(q);
      
      const sources: LeadSourceConfig[] = [];
      snapshot.forEach((doc) => {
        sources.push({
          id: doc.id,
          ...doc.data()
        } as LeadSourceConfig);
      });
      
      return sources;
    } catch (error) {
      console.error('Error getting active lead sources:', error);
      throw new Error('Failed to get active lead sources');
    }
  }

  // Function to update lead statistics
  private updateLeadStats = debounce(async (source?: LeadSource) => {
    try {
      // Get total count of leads
      const totalLeadsQuery = query(this.leadsRef);
      const totalLeadsSnapshot = await getDocs(totalLeadsQuery);
      const totalLeads = totalLeadsSnapshot.size;
      
      // Get leads per source
      const leadsPerSource: Record<LeadSource, number> = {
        apollo: 0,
        facebook: 0,
        tiktok: 0,
        instagram: 0,
        google: 0
      };
      
      for (const src of Object.keys(leadsPerSource) as LeadSource[]) {
        const sourceQuery = query(this.leadsRef, where('source', '==', src));
        const sourceSnapshot = await getDocs(sourceQuery);
        leadsPerSource[src] = sourceSnapshot.size;
      }
      
      // Get leads added today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayQuery = query(
        this.leadsRef, 
        where('createdAt', '>=', today.toISOString())
      );
      const todaySnapshot = await getDocs(todayQuery);
      const leadsAddedToday = todaySnapshot.size;
      
      // Update the stats document
      const statsDoc = doc(this.leadStatsRef, 'current');
      await setDoc(statsDoc, {
        totalLeads,
        leadsPerSource,
        leadsAddedToday,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating lead stats:', error);
    }
  }, 60000); // Update at most once per minute

  // Function to get lead statistics
  async getLeadStats(): Promise<LeadStats> {
    try {
      const statsDoc = await getDoc(doc(this.leadStatsRef, 'current'));
      
      if (!statsDoc.exists()) {
        // Initialize with default values if stats don't exist
        const defaultStats: LeadStats = {
          totalLeads: 0,
          leadsPerSource: {
            apollo: 0,
            facebook: 0,
            tiktok: 0,
            instagram: 0,
            google: 0
          },
          leadsAddedToday: 0,
          campaignsUsing: 0,
          averageScore: 0,
          averageConversionRate: 0,
          sourcePerformance: {
            apollo: { conversionRate: 0, openRate: 0, clickRate: 0 },
            facebook: { conversionRate: 0, openRate: 0, clickRate: 0 },
            tiktok: { conversionRate: 0, openRate: 0, clickRate: 0 },
            instagram: { conversionRate: 0, openRate: 0, clickRate: 0 },
            google: { conversionRate: 0, openRate: 0, clickRate: 0 }
          }
        };
        
        await setDoc(doc(this.leadStatsRef, 'current'), defaultStats);
        return defaultStats;
      }
      
      return statsDoc.data() as LeadStats;
    } catch (error) {
      console.error('Error getting lead stats:', error);
      throw new Error('Failed to get lead statistics');
    }
  }
  
  // Clear the cache (useful when adding new leads)
  clearCache(): void {
    this.leadCache.clear();
    this.cacheTimestamps.clear();
  }
  
  // Track which API keys are approaching their limits
  async trackApiUsage(source: LeadSource, creditsUsed: number, apiKey: string): Promise<void> {
    try {
      const sourceConfig = await this.getLeadSourceConfig(source);
      
      if (!sourceConfig) {
        throw new Error(`Lead source config for ${source} not found`);
      }
      
      // Update credits remaining
      const creditsRemaining = (sourceConfig.creditsRemaining || 0) - creditsUsed;
      const creditsUsedToday = (sourceConfig.creditsUsedToday || 0) + creditsUsed;
      
      await this.updateLeadSourceConfig({
        ...sourceConfig,
        creditsRemaining,
        creditsUsedToday,
        lastFetch: new Date().toISOString()
      });
      
      // Check if we need to send an alert
      if (creditsRemaining <= 10) {
        // Send alert to admin (this could be a notification, email, etc.)
        await this.createApiLimitAlert(source, creditsRemaining, apiKey);
      }
    } catch (error) {
      console.error('Error tracking API usage:', error);
      throw new Error('Failed to track API usage');
    }
  }
  
  // Create an alert for admin when API limits are approaching
  private async createApiLimitAlert(source: LeadSource, creditsRemaining: number, apiKey: string): Promise<void> {
    try {
      const alertsRef = collection(db, 'admin_alerts');
      await addDoc(alertsRef, {
        type: 'api_limit',
        source,
        creditsRemaining,
        apiKey: apiKey.substring(0, 8) + '...', // Only store a partial key for security
        createdAt: new Date().toISOString(),
        status: 'unread'
      });
    } catch (error) {
      console.error('Error creating API limit alert:', error);
    }
  }
}

export const leadDatabaseService = new LeadDatabaseService(); 