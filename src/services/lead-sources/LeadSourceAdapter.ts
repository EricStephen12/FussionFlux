import { Lead, LeadSource } from '@/models/LeadTypes';

export interface LeadSourceAdapter {
  source: LeadSource;
  
  // Method to fetch leads from the source
  fetchLeads(criteria: {
    niche?: string;
    industry?: string[];
    title?: string[];
    location?: string[];
    limit?: number;
    [key: string]: any; // Allow for source-specific criteria
  }): Promise<Lead[]>;
} 