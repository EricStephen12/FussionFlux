export interface Subscription {
  userId: string;
  tier: 'free' | 'starter' | 'growth' | 'pro';
  limits: number;
  maxEmails: number;
  maxContacts: number;
  maxSMS: number;
  features: {
    followUpEmails: boolean;
    abTesting: boolean;
    aiOptimization: boolean;
    analytics: boolean;
    customDomain: boolean;
    previewLeads: boolean;
    importContacts: boolean;
    fullLeadAccess: boolean;
    bulkOperations: boolean;
  };
  expiresAt: string | null;
}

export interface SubscriptionTier {
  name: string;
  price: number;
  limits: number;
  maxEmails: number;
  maxSMS: number;
  maxContacts: number;
  features: {
    followUpEmails: boolean;
    abTesting: boolean;
    aiOptimization: boolean;
    analytics: boolean;
    customDomain: boolean;
    previewLeads: boolean;
    importContacts: boolean;
    fullLeadAccess: boolean;
    bulkOperations: boolean;
  };
  popular?: boolean;
  description?: string;
  cta?: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free Trial',
    price: 0,
    limits: 0,
    maxEmails: 10,
    maxSMS: 0,
    maxContacts: 10,
    features: {
      followUpEmails: false,
      abTesting: false,
      aiOptimization: false,
      analytics: false,
      customDomain: false,
      previewLeads: false,
      importContacts: false,
      fullLeadAccess: false,
      bulkOperations: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 39,
    limits: 1000,
    maxEmails: 5000,
    maxSMS: 500,
    maxContacts: 1000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: false,
      analytics: true,
      customDomain: false,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: true,
      bulkOperations: false,
    },
  },
  growth: {
    name: 'Growth',
    price: 99,
    limits: 5000,
    maxEmails: 15000,
    maxSMS: 1000,
    maxContacts: 2000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: true,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: true,
      bulkOperations: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 199,
    limits: 10000,
    maxEmails: 50000,
    maxSMS: 5000,
    maxContacts: 5000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: true,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: true,
      bulkOperations: true,
    },
  },
}; 