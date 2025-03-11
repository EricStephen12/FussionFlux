'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '@/utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Subscription {
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
  extraEmailPrice?: number;
  extraSMSPrice?: number;
  extraLeadsPrice?: number;
  trialDuration?: number;
  specialOffer?: {
    enabled: boolean;
    discountPercentage: number;
    durationMonths: number;
    bonusAmount: number;
    bonusFeatures: string[];
    expiryDate: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: '14-Day Trial',
    price: 0,
    limits: 100,
    maxEmails: 250,
    maxSMS: 50,
    maxContacts: 100,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: false,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: false,
      bulkOperations: false,
    },
    description: 'Try all features free for 14 days',
    extraEmailPrice: 0.004,
    extraSMSPrice: 0.03,
    extraLeadsPrice: 0.06,
    trialDuration: 14 // days
  },
  starter: {
    name: 'Starter',
    price: 39,
    specialOffer: {
      enabled: true,
      discountPercentage: 50,
      durationMonths: 3,
      bonusAmount: 500,
      bonusFeatures: [
        'Unlimited Email Templates',
        'AI Copywriting Credits',
        'Priority Support'
      ],
      expiryDate: '2024-05-01' // Set this to your desired expiry date
    },
    limits: 1000,
    maxEmails: 5000,
    maxSMS: 500,
    maxContacts: 1000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: false,
      previewLeads: true,
      importContacts: true,
      fullLeadAccess: true,
      bulkOperations: false,
    },
    description: 'Perfect for growing businesses',
    extraEmailPrice: 0.003,
    extraSMSPrice: 0.02,
    extraLeadsPrice: 0.05,
  },
  grower: {
    name: 'Grower',
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
    description: 'Perfect for growing businesses',
    extraEmailPrice: 0.002, // $2 per 1000 emails
    extraSMSPrice: 0.015,   // 1.5 cents per SMS
    extraLeadsPrice: 0.04,  // 4 cents per lead
    popular: true,
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
    description: 'For power users and agencies',
    extraEmailPrice: 0.001, // $1 per 1000 emails
    extraSMSPrice: 0.01,    // 1 cent per SMS
    extraLeadsPrice: 0.03,  // 3 cents per lead
  },
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('User not authenticated');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (!userData) {
        setError('User data not found.');
        return;
      }

      // Check for subscription data
      const subscriptionData = userData.subscriptionData;

      if (!subscriptionData) {
        // Set up default subscription for free tier
        setSubscription({
          userId: user.uid,
          tier: 'free',
          limits: SUBSCRIPTION_TIERS.free.limits,
          maxEmails: SUBSCRIPTION_TIERS.free.maxEmails,
          maxContacts: SUBSCRIPTION_TIERS.free.maxContacts,
          maxSMS: SUBSCRIPTION_TIERS.free.maxSMS,
          features: SUBSCRIPTION_TIERS.free.features,
          expiresAt: null,
        });
        return;
      }

      // Continue with existing logic for users with subscription data
      const tierData = SUBSCRIPTION_TIERS[subscriptionData.tier];
      setSubscription({
        userId: user.uid,
        tier: subscriptionData.tier,
        limits: tierData.limits,
        maxEmails: tierData.maxEmails,
        maxContacts: tierData.maxContacts,
        maxSMS: tierData.maxSMS,
        features: tierData.features,
        expiresAt: subscriptionData.expiresAt,
      });
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFeatureAccess = (feature: keyof Subscription['features']) => {
    if (!subscription) return false;
    return subscription.features[feature];
  };

  const getRemainingLimits = () => {
    if (!subscription) return 0;
    return subscription.limits;
  };

  const getMaxEmails = () => {
    if (!subscription) return 0;
    return subscription.maxEmails;
  };

  const getMaxContacts = () => {
    if (!subscription) return 0;
    return subscription.maxContacts;
  };

  const getMaxSMS = () => {
    if (!subscription) return 0;
    return subscription.maxSMS;
  };

  const isTrialValid = () => {
    if (!subscription || subscription.tier !== 'free') return false;
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt) > new Date() && subscription.limits > 0 && subscription.maxEmails > 0;
  };

  return {
    subscription,
    isLoading,
    error,
    subscriptionTiers: SUBSCRIPTION_TIERS,
    checkFeatureAccess,
    getRemainingLimits,
    getMaxEmails,
    getMaxContacts,
    getMaxSMS,
    isTrialValid,
  };
};

function calculateEmailsUsed(contacts: number, splitA: number, splitB: number, followUp: boolean = false): number {
  let emailsA = Math.ceil(contacts * (splitA / 100));
  let emailsB = Math.ceil(contacts * (splitB / 100));
  let totalEmails = emailsA + emailsB;

  if (followUp) {
    totalEmails *= 2; // Double the emails for follow-ups
  }

  return totalEmails;
}

function calculateSMSUsed(contacts: number, splitA: number, splitB: number, smsA: boolean = false, smsB: boolean = false): number {
  let smsUsed = 0;

  if (smsA) {
    smsUsed += Math.ceil(contacts * (splitA / 100));
  }
  if (smsB) {
    smsUsed += Math.ceil(contacts * (splitB / 100));
  }

  return smsUsed;
} 