'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '@/services/firestore';

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
  usageStats: {
    usedEmails: number;
    usedSMS: number;
    usedLeads: number;
  };
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  error: null,
  refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const userDoc = await firestoreService.getUserDocument(userId);
      
      if (!userDoc) {
        // Initialize free tier subscription for new users
        const freeTierSubscription: Subscription = {
          userId,
          tier: 'free',
          limits: 100,
          maxEmails: 250,
          maxContacts: 100,
          maxSMS: 50,
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
          expiresAt: null,
          usageStats: {
            usedEmails: 0,
            usedSMS: 0,
            usedLeads: 0,
          },
        };

        await firestoreService.createUserDocument(userId, {
          subscription: freeTierSubscription,
        });

        setSubscription(freeTierSubscription);
      } else {
        setSubscription(userDoc.subscription);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await loadSubscription(user.uid);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscription(user.uid);
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 