/**
 * Feature access utility functions for checking subscription-based feature availability
 */

import { useSubscription } from '@/hooks/useSubscription';

// Feature mapping - maps UI features to subscription feature flags
export type UIFeature = 
  | 'abTesting' 
  | 'analytics' 
  | 'personalization'
  | 'smsIntegration'
  | 'aiOptimization'
  | 'customDomain'
  | 'followUpEmails'
  | 'bulkOperations'
  | 'previewLeads'
  | 'importContacts'
  | 'fullLeadAccess';

// Map UI features to subscription feature keys
const featureMapping: Record<UIFeature, keyof ReturnType<typeof useSubscription>['subscription']['features']> = {
  // Direct mappings
  abTesting: 'abTesting',
  analytics: 'analytics',
  aiOptimization: 'aiOptimization',
  customDomain: 'customDomain',
  followUpEmails: 'followUpEmails',
  bulkOperations: 'bulkOperations',
  previewLeads: 'previewLeads',
  importContacts: 'importContacts',
  fullLeadAccess: 'fullLeadAccess',
  
  // Indirect mappings - using related features
  personalization: 'abTesting', // Personalization requires A/B testing tier
  smsIntegration: 'followUpEmails' // SMS integration requires follow-up emails tier
};

/**
 * Check if a feature is available based on the current subscription
 * 
 * @param feature The UI feature to check
 * @param subscription The current subscription from useSubscription hook
 * @returns boolean indicating if the feature is available
 */
export const checkFeatureAccess = (
  feature: UIFeature,
  subscription: ReturnType<typeof useSubscription>['subscription'],
  checkFeatureAccessFn: ReturnType<typeof useSubscription>['checkFeatureAccess']
): boolean => {
  if (!subscription) return false;
  
  // Special handling for free trial users
  if (subscription.tier === 'free' && subscription.expiresAt) {
    const expiryDate = new Date(subscription.expiresAt);
    const isTrialActive = expiryDate > new Date();
    
    if (isTrialActive) {
      // Features available during trial period
      const trialFeatures: UIFeature[] = [
        'analytics',
        'previewLeads',
        'importContacts',
        'abTesting',
        'personalization',  // Limited version during trial
        'smsIntegration'    // Limited version during trial
      ];
      
      if (trialFeatures.includes(feature)) {
        return true;
      }
    }
  }
  
  // For paid subscriptions, use the subscription's feature flag system
  const subscriptionFeature = featureMapping[feature];
  return checkFeatureAccessFn(subscriptionFeature);
};

/**
 * React hook for checking feature access
 * @returns Object with checkAccess function
 */
export const useFeatureAccess = () => {
  const { subscription, checkFeatureAccess: subscriptionCheckFeatureAccess } = useSubscription();
  
  const checkAccess = (feature: UIFeature): boolean => {
    return checkFeatureAccess(feature, subscription, subscriptionCheckFeatureAccess);
  };
  
  return { checkAccess };
}; 