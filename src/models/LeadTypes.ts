export type LeadSource = 'apollo' | 'facebook' | 'tiktok' | 'instagram' | 'google';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  company?: string;
  industry?: string;
  location?: string;
  niche?: string;
  source: LeadSource;
  score?: number;
  conversionPotential?: number;
  interests?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastEnriched?: string;
  engagementRate?: number;
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  buyingHistory?: {
    lastPurchaseDate?: string;
    totalSpent?: number;
    categories?: string[];
    frequency?: 'high' | 'medium' | 'low';
  };
  verified: boolean;
}

export interface LeadBatch {
  id: string;
  source: LeadSource;
  fetchDate: string;
  count: number;
  niche?: string;
  location?: string;
  tags?: string[];
  apiKeyUsed?: string;
  creditsUsed?: number;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

export interface LeadSourceConfig {
  id: string;
  source: LeadSource;
  active: boolean;
  apiKey?: string;
  creditsRemaining?: number;
  creditsUsedToday?: number;
  dailyLimit: number;
  lastFetch?: string;
  fetchPriority: number; // Higher number = higher priority
  targetNiches?: string[];
  fetchCriteria?: Record<string, any>;
  autoRotateKeys?: boolean;
  alternativeApiKeys?: string[];
}

export interface LeadStats {
  totalLeads: number;
  leadsPerSource: Record<LeadSource, number>;
  leadsAddedToday: number;
  campaignsUsing: number;
  averageScore: number;
  averageConversionRate: number;
  sourcePerformance: Record<LeadSource, {
    conversionRate: number;
    openRate: number;
    clickRate: number;
  }>;
} 