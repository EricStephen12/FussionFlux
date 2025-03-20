'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firestoreService } from '@/services/firestore';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';

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

      const userDoc = await getDoc(doc(firestoreService.db, 'users', user.uid));
      const userData = userDoc.data();

      if (!userData) {
        setError('User data not found.');
        return;
      }

      // Check for subscription data
      const subscriptionData = userData.subscriptionData;

      if (!subscriptionData) {
        // Set up default subscription for free tier with 14-day trial
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        
        const defaultSubscription: Subscription = {
          userId: user.uid,
          tier: 'free',
          limits: SUBSCRIPTION_TIERS.free.limits,
          maxEmails: SUBSCRIPTION_TIERS.free.maxEmails,
          maxContacts: SUBSCRIPTION_TIERS.free.maxContacts,
          maxSMS: SUBSCRIPTION_TIERS.free.maxSMS,
          features: SUBSCRIPTION_TIERS.free.features,
          expiresAt: trialEndDate.toISOString(),
        };

        // Save the default subscription to Firestore
        await updateDoc(doc(firestoreService.db, 'users', user.uid), {
          subscriptionData: defaultSubscription,
        });

        setSubscription(defaultSubscription);
        return;
      }

      // Check if trial has expired
      if (subscriptionData.tier === 'free' && subscriptionData.expiresAt) {
        const expiryDate = new Date(subscriptionData.expiresAt);
        if (expiryDate < new Date()) {
          // Trial has expired, update to free tier without trial benefits
          const expiredSubscription: Subscription = {
            userId: user.uid,
            tier: 'free',
            limits: 0,
            maxEmails: 0,
            maxContacts: 0,
            maxSMS: 0,
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
            expiresAt: null,
          };

          // Update the subscription in Firestore
          await updateDoc(doc(firestoreService.db, 'users', user.uid), {
            subscriptionData: expiredSubscription,
          });

          setSubscription(expiredSubscription);
          return;
        }
      }

      // Continue with existing logic for users with subscription data
      const tierData = SUBSCRIPTION_TIERS[subscriptionData.tier];
      const currentSubscription: Subscription = {
        userId: user.uid,
        tier: subscriptionData.tier,
        limits: tierData.limits,
        maxEmails: tierData.maxEmails,
        maxContacts: tierData.maxContacts,
        maxSMS: tierData.maxSMS,
        features: tierData.features,
        expiresAt: subscriptionData.expiresAt,
      };

      setSubscription(currentSubscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const value = {
    subscription,
    isLoading,
    error,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 