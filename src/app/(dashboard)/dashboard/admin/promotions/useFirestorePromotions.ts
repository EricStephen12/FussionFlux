'use client';

import { useState, useEffect } from 'react';
import { firestoreService } from '@/services/firestore';
import { collection, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/hooks/useSubscription';

export interface FirestorePromotion {
  enabled: boolean;
  discountPercentage: number;
  durationMonths: number;
  bonusAmount: number;
  bonusFeatures: string[];
  expiryDate: string;
  updatedAt: string;
  trackingCode?: string;
}

export interface DynamicSubscriptionTier extends SubscriptionTier {
  specialOffer?: {
    enabled: boolean;
    discountPercentage: number;
    durationMonths: number;
    bonusAmount: number;
    bonusFeatures: string[];
    expiryDate: string;
  };
}

export function useFirestorePromotions() {
  const [dynamicTiers, setDynamicTiers] = useState<Record<string, DynamicSubscriptionTier>>(SUBSCRIPTION_TIERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSpecialOffers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all special offers from Firestore
        const specialOffersRef = collection(firestoreService.db, 'specialOffers');
        const snapshot = await getDocs(specialOffersRef);
        
        // Create a new object with the updated tiers
        const updatedTiers = { ...SUBSCRIPTION_TIERS };
        
        snapshot.docs.forEach(doc => {
          const tierId = doc.id;
          const offerData = doc.data() as FirestorePromotion;
          
          // Only apply if this tier exists in our subscription tiers
          if (updatedTiers[tierId]) {
            // Check if the offer is active (not expired and enabled)
            const isActive = offerData.enabled && new Date(offerData.expiryDate) > new Date();
            
            if (isActive) {
              // Update the tier with the dynamic special offer
              updatedTiers[tierId] = {
                ...updatedTiers[tierId],
                specialOffer: {
                  enabled: true,
                  discountPercentage: offerData.discountPercentage,
                  durationMonths: offerData.durationMonths,
                  bonusAmount: offerData.bonusAmount,
                  bonusFeatures: offerData.bonusFeatures,
                  expiryDate: offerData.expiryDate
                }
              };
            } else {
              // Either disable the offer or remove it
              if (updatedTiers[tierId].specialOffer) {
                updatedTiers[tierId] = {
                  ...updatedTiers[tierId],
                  specialOffer: {
                    ...updatedTiers[tierId].specialOffer!,
                    enabled: false
                  }
                };
              }
            }
          }
        });
        
        setDynamicTiers(updatedTiers);
      } catch (err) {
        console.error('Error loading special offers:', err);
        setError('Failed to load promotional offers');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSpecialOffers();
    
    // Set up a real-time listener for changes to special offers
    const specialOffersRef = collection(firestoreService.db, 'specialOffers');
    const unsubscribe = onSnapshot(specialOffersRef, (snapshot) => {
      loadSpecialOffers(); // Reload offers when changes occur
    }, (err) => {
      console.error('Error in special offers listener:', err);
    });
    
    return () => unsubscribe();
  }, []);
  
  return {
    dynamicTiers,
    isLoading,
    error
  };
}

// Utility function to check if a promotion code is valid
export async function isPromotionCodeValid(code: string): Promise<{
  valid: boolean;
  tier?: string;
  discount?: number;
}> {
  try {
    const promotionsRef = collection(firestoreService.db, 'promotions');
    const snapshot = await getDocs(promotionsRef);
    
    for (const doc of snapshot.docs) {
      const promotion = doc.data() as any;
      
      if (
        promotion.trackingCode === code &&
        promotion.enabled &&
        new Date(promotion.expiryDate) > new Date()
      ) {
        return {
          valid: true,
          tier: promotion.tier,
          discount: promotion.discountPercentage
        };
      }
    }
    
    return { valid: false };
  } catch (error) {
    console.error('Error checking promotion code:', error);
    return { valid: false };
  }
} 