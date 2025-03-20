// @ts-nocheck

import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, where, increment, addDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';

const dbFirestore = getFirestore(); // Initialize Firestore instance here

interface UserLimits {
  userId: string;
  emailLimits: number;
  smsLimits: number;
  lastPurchase?: Date;
  trialUsage?: {
    previewLeads: number;
    importedContacts: number;
    emailsSent: number;
    lastReset: string;
    startDate: string;
    endDate: string;
  };
}

interface BulkDiscount {
  amount: number;
  discount: number;
}

interface ExtraLimitConfig {
  PRICE_PER_LIMIT: number;
  MIN_PURCHASE: number;
  BULK_DISCOUNTS: BulkDiscount[];
}

interface LimitTransaction {
  id: string;
  userId: string;
  type: 'email' | 'sms';
  amount: number;
  paymentId: string;
  timestamp: string;
  previousBalance: number;
  newBalance: number;
  source: string;
}

const LIMIT_CONFIG = {
  PACKAGES: [
    { 
      emailLimits: 5000,
      smsLimits: 500,
      price: 39,
      features: ['Advanced targeting', 'Advanced templates', 'Basic analytics']
    },    // Starter
    { 
      emailLimits: 15000,
      smsLimits: 1500,
      price: 99,
      features: ['Premium targeting', 'Premium templates', 'Advanced analytics']
    },  // Growth
    { 
      emailLimits: 50000,
      smsLimits: 5000,
      price: 199,
      features: ['Enterprise targeting', 'All templates', 'Full analytics suite']
    }  // Professional
  ],
  EXTRA_LIMITS: {
    EMAIL: {
      PRICE_PER_LIMIT: 0.004,
      MIN_PURCHASE: 500,
      BULK_DISCOUNTS: [
        { amount: 2500, discount: 0.10 },
        { amount: 10000, discount: 0.15 },
        { amount: 25000, discount: 0.20 }
      ]
    } as ExtraLimitConfig,
    SMS: {
      PRICE_PER_LIMIT: 0.03,
      MIN_PURCHASE: 250,
      BULK_DISCOUNTS: [
        { amount: 1000, discount: 0.10 },
        { amount: 5000, discount: 0.15 },
        { amount: 10000, discount: 0.20 }
      ]
    } as ExtraLimitConfig
  },
  TRIAL: {
    PREVIEW_LEADS: 100,
    IMPORTED_CONTACTS: 100,
    EMAILS_PER_DAY: 250,
    DURATION_DAYS: 14,
    FEATURES: ['preview_leads', 'import_contacts', 'basic_templates', 'campaign_tracking']
  },
  MIN_PURCHASE: {
    EMAIL: 500,
    SMS: 250
  },
  CONVERSION_METRICS: {
    EXPECTED_OPEN_RATE: 0.25,
    EXPECTED_CLICK_RATE: 0.08,
    EXPECTED_CONVERSION: 0.02,
    AVG_ORDER_VALUE: 35,
  }
};

async function getUserSubscriptionTier(userId: string): Promise<string> {
    if (typeof userId !== 'string' || !userId) {
        console.error('Invalid userId:', userId);
        throw new Error('Invalid userId provided');
    }
    console.log('Fetching subscription tier for userId:', userId);
    const userDoc = await getDoc(doc(dbFirestore, 'users', userId));
    if (!userDoc.exists()) {
        console.error('User not found for userId:', userId);
        throw new Error('User not found');
    }
    return userDoc.data()?.tier || 'basic'; // Default to 'basic' if no tier is found
}

export class TrialService {
  private static readonly TRIAL_DURATION_DAYS = 14;
  private static readonly TRIAL_EMAIL_LIMIT = 250;
  private static readonly TRIAL_CONTACT_LIMIT = 100;
  private static readonly TRIAL_SMS_LIMIT = 50;

  static async initializeTrial(userId: string) {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + this.TRIAL_DURATION_DAYS);

    const trialData = {
      tier: 'free',
      limits: this.TRIAL_EMAIL_LIMIT,
      maxEmails: this.TRIAL_EMAIL_LIMIT,
      maxContacts: this.TRIAL_CONTACT_LIMIT,
      maxSMS: this.TRIAL_SMS_LIMIT,
      features: SUBSCRIPTION_TIERS.free.features,
      expiresAt: trialEndDate.toISOString(),
      usageStats: {
        usedEmails: 0,
        usedSMS: 0,
        usedLeads: 0,
      },
    };

    await updateDoc(doc(db, 'users', userId), {
      subscriptionData: trialData,
    });

    return trialData;
  }

  static async isTrialActive(userId: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData?.subscriptionData) return false;

    const { tier, expiresAt, usageStats } = userData.subscriptionData;

    if (tier !== 'free' || !expiresAt) return false;

    const expiryDate = new Date(expiresAt);
    const isExpired = expiryDate < new Date();
    const hasExceededLimits = usageStats?.usedEmails >= this.TRIAL_EMAIL_LIMIT;

    if (isExpired || hasExceededLimits) {
      // Update to expired trial state
      await this.handleTrialExpiration(userId);
      return false;
    }

    return true;
  }

  static async getRemainingLimits(userId: string) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData?.subscriptionData) {
      return {
        emails: 0,
        contacts: 0,
        sms: 0,
      };
    }

    const { usageStats } = userData.subscriptionData;
    const isActive = await this.isTrialActive(userId);

    if (!isActive) {
      return {
        emails: 0,
        contacts: 0,
        sms: 0,
      };
    }

    return {
      emails: this.TRIAL_EMAIL_LIMIT - (usageStats?.usedEmails || 0),
      contacts: this.TRIAL_CONTACT_LIMIT - (usageStats?.usedLeads || 0),
      sms: this.TRIAL_SMS_LIMIT - (usageStats?.usedSMS || 0),
    };
  }

  static async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData?.subscriptionData) return false;

    const { tier, features } = userData.subscriptionData;

    if (tier === 'free') {
      const isActive = await this.isTrialActive(userId);
      if (!isActive) return false;
    }

    return features?.[feature] || false;
  }

  private static async handleTrialExpiration(userId: string) {
    const expiredSubscription = {
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

    await updateDoc(doc(db, 'users', userId), {
      subscriptionData: expiredSubscription,
    });
  }
}

class CreditsService {
  async getTrialCredits(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      return {
        emailCredits: userData.totalEmails || 0,
        smsCredits: userData.totalSMS || 0,
        leadCredits: userData.totalLeads || 0,
      };
    } catch (error) {
      console.error('Error getting trial credits:', error);
      throw error;
    }
  }

  async addTrialCredits(userId: string, type: 'email' | 'sms' | 'lead', amount: number) {
    try {
      const userRef = doc(db, 'users', userId);
      const field = `total${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      
      await updateDoc(userRef, {
        [field]: increment(amount),
      });

      return true;
    } catch (error) {
      console.error('Error adding trial credits:', error);
      throw error;
    }
  }

  calculateExtraCreditPrice(type: string, amount: number) {
    const basePrices = {
      EMAIL: 0.004, // $0.004 per email
      SMS: 0.03,    // $0.03 per SMS
      LEAD: 0.06    // $0.06 per lead
    };

    const basePrice = basePrices[type] || 0;
    const baseTotal = basePrice * amount;
    
    // Apply bulk discounts
    let discount = 0;
    const discountTiers = [
      { threshold: 100000, discount: 0.25 }, // 25% off for 100k+
      { threshold: 50000, discount: 0.20 },  // 20% off for 50k+
      { threshold: 10000, discount: 0.15 },  // 15% off for 10k+
      { threshold: 5000, discount: 0.10 },   // 10% off for 5k+
      { threshold: 1000, discount: 0.05 }    // 5% off for 1k+
    ];

    for (const tier of discountTiers) {
      if (amount >= tier.threshold) {
        discount = baseTotal * tier.discount;
        break;
      }
    }

    // Apply subscription tier bonus
    const subscriptionBonus = {
      pro: 0.10,    // 10% bonus for Pro users
      grower: 0.05, // 5% bonus for Grower users
      starter: 0.02 // 2% bonus for Starter users
    };

    const finalPrice = baseTotal * (1 - discount);
    const pricePerCredit = finalPrice / amount;

    return {
      basePrice: baseTotal,
      discount,
      finalPrice,
      pricePerCredit,
      subscriptionBonus
    };
  }

  async addExtraCredits(userId: string, type: 'email' | 'sms' | 'lead', amount: number) {
    try {
      const userRef = doc(db, 'users', userId);
      const field = `total${type.charAt(0).toUpperCase() + type.slice(1)}s`;
      
      // Add transaction record
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        userId,
        type: 'credit_purchase',
        creditType: type,
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      // Update user credits
      await updateDoc(userRef, {
        [field]: increment(amount),
        lastCreditPurchase: new Date().toISOString()
      });

      return {
        success: true,
        transactionId: transactionRef.id
      };
    } catch (error) {
      console.error('Error adding extra credits:', error);
      throw error;
    }
  }

  async getCreditHistory(userId: string) {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        where('type', '==', 'credit_purchase'),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting credit history:', error);
      throw error;
    }
  }
}

export const creditsService = new CreditsService();

export { LIMIT_CONFIG }; 