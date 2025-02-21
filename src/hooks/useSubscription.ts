import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Subscription {
  tier: 'free' | 'starter' | 'grower' | 'pro' | 'enterprise';
  credits: number;
  maxEmails: number;
  maxContacts: number;
  features: {
    followUpEmails: boolean;
    abTesting: boolean;
    aiOptimization: boolean;
    analytics: boolean;
    customDomain: boolean;
  };
  expiresAt?: string;
}

interface SubscriptionTier {
  name: string;
  price: number;
  credits: number;
  maxEmails: number;
  maxContacts: number;
  features: {
    followUpEmails: boolean;
    abTesting: boolean;
    aiOptimization: boolean;
    analytics: boolean;
    customDomain: boolean;
  };
}

const subscriptionTiers: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    price: 0,
    credits: 0,
    maxEmails: 5,
    maxContacts: 5,
    features: {
      followUpEmails: false,
      abTesting: false,
      aiOptimization: false,
      analytics: false,
      customDomain: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 19,
    credits: 100,
    maxEmails: 1000,
    maxContacts: 100,
    features: {
      followUpEmails: true,
      abTesting: false,
      aiOptimization: true,
      analytics: true,
      customDomain: false,
    },
  },
  grower: {
    name: 'Grower',
    price: 29,
    credits: 500,
    maxEmails: 2000,
    maxContacts: 500,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: true,
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    credits: 1000,
    maxEmails: 4000,
    maxContacts: 1000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: true,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 249,
    credits: 5000,
    maxEmails: 20000,
    maxContacts: 5000,
    features: {
      followUpEmails: true,
      abTesting: true,
      aiOptimization: true,
      analytics: true,
      customDomain: true,
    },
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
      // Replace with actual API call
      const response = await fetch('/api/subscription');
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError('Failed to load subscription');
      // Default to free tier if loading fails
      setSubscription({
        tier: 'free',
        credits: 0,
        maxEmails: 5,
        maxContacts: 5,
        features: {
          followUpEmails: false,
          abTesting: false,
          aiOptimization: false,
          analytics: false,
          customDomain: false,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeTier = async (tier: string) => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError('Failed to upgrade subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const addCredits = async (amount: number) => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/subscription/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError('Failed to add credits');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFeatureAccess = (feature: keyof Subscription['features']) => {
    if (!subscription) return false;
    return subscription.features[feature];
  };

  const getRemainingCredits = () => {
    if (!subscription) return 0;
    return subscription.credits;
  };

  const getMaxEmails = () => {
    if (!subscription) return 5;
    return subscription.maxEmails;
  };

  const getMaxContacts = () => {
    if (!subscription) return 5;
    return subscription.maxContacts;
  };

  return {
    subscription,
    isLoading,
    error,
    upgradeTier,
    addCredits,
    checkFeatureAccess,
    getRemainingCredits,
    getMaxEmails,
    getMaxContacts,
    subscriptionTiers,
  };
}; 