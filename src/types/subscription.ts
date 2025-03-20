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
    limits: 100,
    maxEmails: 250,
    maxSMS: 50,
    maxContacts: 100,
    features: {
      followUpEmails: false,
      abTesting: false,
      aiOptimization: false,
      analytics: true,
      customDomain: false,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: false,
      bulkOperations: false,
    },
    description: 'Try our platform risk-free for 14 days',
    popular: false,
    cta: 'Start Free Trial',
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
    description: 'Perfect for new dropshippers starting their journey',
    popular: false,
    cta: 'Get Started',
  },
  growth: {
    name: 'Growth',
    price: 99,
    limits: 5000,
    maxEmails: 15000,
    maxSMS: 1500,
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
    description: 'Most chosen by successful dropshippers',
    popular: true,
    cta: 'Upgrade Now',
  },
  pro: {
    name: 'Pro',
    price: 199,
    limits: 15000,
    maxEmails: 50000,
    maxSMS: 5000,
    maxContacts: 15000,
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
    description: 'For established dropshippers with high volume needs',
    popular: false,
    cta: 'Get Pro',
  },
}; 