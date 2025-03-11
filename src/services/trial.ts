// @ts-nocheck

import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

const db = getFirestore(); // Initialize Firestore instance here

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
      emailLimits: 1000,
      smsLimits: 500,
      price: 99,
      features: ['Advanced targeting', 'Advanced templates', 'Basic analytics']
    },    // Starter
    { 
      emailLimits: 5000,
      smsLimits: 2500,
      price: 199,
      features: ['Premium targeting', 'Premium templates', 'Advanced analytics']
    },  // Growth
    { 
      emailLimits: 15000,
      smsLimits: 7500,
      price: 399,
      features: ['Enterprise targeting', 'All templates', 'Full analytics suite']
    }  // Professional
  ],
  EXTRA_LIMITS: {
    EMAIL: {
      PRICE_PER_LIMIT: 0.10,
      MIN_PURCHASE: 500,
      BULK_DISCOUNTS: [
        { amount: 2500, discount: 0.10 },
        { amount: 10000, discount: 0.15 },
        { amount: 25000, discount: 0.20 }
      ]
    } as ExtraLimitConfig,
    SMS: {
      PRICE_PER_LIMIT: 0.20,
      MIN_PURCHASE: 250,
      BULK_DISCOUNTS: [
        { amount: 1000, discount: 0.10 },
        { amount: 5000, discount: 0.15 },
        { amount: 10000, discount: 0.20 }
      ]
    } as ExtraLimitConfig
  },
  TRIAL: {
    PREVIEW_LEADS: 50,
    IMPORTED_CONTACTS: 250,
    EMAILS_PER_DAY: 50,
    DURATION_DAYS: 14,
    FEATURES: ['preview_leads', 'import_contacts', 'basic_templates', 'campaign_tracking']
  },
  MIN_PURCHASE: {
    EMAIL: 500,
    SMS: 250
  },
  CONVERSION_METRICS: {
    EXPECTED_OPEN_RATE: 0.25, // 25% open rate for targeted dropshipping
    EXPECTED_CLICK_RATE: 0.08, // 8% click rate for e-commerce
    EXPECTED_CONVERSION: 0.02, // 2% conversion rate (industry standard for dropshipping)
    AVG_ORDER_VALUE: 35, // Average order value in USD
  }
};

async function getUserSubscriptionTier(userId: string): Promise<string> {
    if (typeof userId !== 'string' || !userId) {
        console.error('Invalid userId:', userId);
        throw new Error('Invalid userId provided');
    }
    console.log('Fetching subscription tier for userId:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
        console.error('User not found for userId:', userId);
        throw new Error('User not found');
    }
    return userDoc.data()?.tier || 'basic'; // Default to 'basic' if no tier is found
}

export class TrialService {
  private creditsRef = collection(db, 'user_credits');

  async getUserLimits(userId: string): Promise<UserLimits | null> {
    const userDoc = await getDoc(doc(this.creditsRef, userId));
    return userDoc.exists() ? (userDoc.data() as UserLimits) : null;
  }

  async updateUserLimits(userId: string, limits: Partial<UserLimits>): Promise<void> {
    const userRef = doc(this.creditsRef, userId);
    await updateDoc(userRef, limits);
  }

  async purchaseExtraLimits(
    userId: string,
    type: 'email' | 'sms',
    amount: number,
    paymentId: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    // Logic to purchase extra limits
  }

  async getRemainingLimits(userId: string): Promise<{
    email: number;
    sms: number;
    trial?: {
      previews: number;
      imports: number;
      emails: number;
    };
  }> {
    const doc = await this.creditsRef.doc(userId).get();
    const userData = doc.data();
    
    if (userData?.trialUsage && this.isTrialActive(userData.trialUsage)) {
      return {
        email: 0,
        sms: 0,
        trial: {
          previews: LIMIT_CONFIG.TRIAL.PREVIEW_LEADS - userData.trialUsage.previewLeads,
          imports: LIMIT_CONFIG.TRIAL.IMPORTED_CONTACTS - userData.trialUsage.importedContacts,
          emails: LIMIT_CONFIG.TRIAL.EMAILS_PER_DAY - userData.trialUsage.emailsSent
        }
      };
    }
    
    return {
      email: userData?.emailLimits || 0,
      sms: userData?.smsLimits || 0
    };
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const userLimits = await this.getUserLimits(userId);
    if (!userLimits) return false;

    const tierFeatures = SUBSCRIPTION_TIERS[userLimits.tier].features;
    return tierFeatures.includes(feature);
  }
}

export class CreditsService {
  private db: Firestore;
  private userId: string;

  constructor(userId: string) {
    this.db = getFirestore(); // Initialize Firestore instance here
    this.userId = userId; // Store userId for later use
  }

  async getUserSubscriptionTier(): Promise<string> {
    if (typeof this.userId !== 'string' || !this.userId) {
      console.error('Invalid userId:', this.userId);
      throw new Error('Invalid userId provided');
    }
    console.log('Fetching subscription tier for userId:', this.userId);
    const userDoc = await getDoc(doc(this.db, 'users', this.userId));
    if (!userDoc.exists()) {
      console.error('User not found for userId:', this.userId);
      throw new Error('User not found');
    }
    return userDoc.data()?.tier || 'basic'; // Default to 'basic' if no tier is found
  }

  async initializeUser(userId: string): Promise<void> {
    if (typeof userId !== 'string' || !userId) {
        console.error('Invalid userId:', userId);
        throw new Error('Invalid userId provided');
    }
    try {
        await this.db.collection('users').doc(userId).set({
            emailLimits: 0,
            smsLimits: 0,
            createdAt: new Date().toISOString(),
            trialUsage: {
                previewLeads: 0,
                importedContacts: 0,
                emailsSent: 0,
                lastReset: new Date().toISOString(),
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + (LIMIT_CONFIG.TRIAL.DURATION_DAYS * 24 * 60 * 60 * 1000)).toISOString()
            }
        });
    } catch (error) {
        console.error('Initialize user error:', error);
        throw new Error('Failed to initialize user');
    }
  }

  async addCredits(userId: string, type: 'email' | 'sms', amount: number): Promise<void> {
    if (typeof userId !== 'string' || !userId) {
        console.error('Invalid userId:', userId);
        throw new Error('Invalid userId provided');
    }
    if (await this.getUserSubscriptionTier() === 'basic') {
        throw new Error('This feature is only available for premium users.');
    }
    const userRef = this.db.collection('users').doc(userId);
    const creditsField = type === 'email' ? 'emailLimits' : 'smsLimits';
    await userRef.update({
        [creditsField]: this.db.FieldValue.increment(amount),
        lastPurchase: new Date().toISOString()
    });
  }

  async deductCredits(userId: string, amount: number): Promise<boolean> {
    if (typeof userId !== 'string' || !userId) {
        console.error('Invalid userId:', userId);
        throw new Error('Invalid userId provided');
    }
    const userRef = this.db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        console.error('User not found for userId:', userId);
        return false;
    }
    const currentCredits = userDoc.data()?.credits || 0;
    if (currentCredits < amount) return false;
    await userRef.update({
        credits: currentCredits - amount
    });
    return true;
  }

  getCreditPackages() {
    return LIMIT_CONFIG.PACKAGES;
  }

  getMinimumPurchase() {
    return LIMIT_CONFIG.MIN_PURCHASE;
  }

  async checkTrialEligibility(userId: string): Promise<{
    canUse: boolean;
    remainingPreviews: number;
    remainingImports: number;
    remainingEmails: number;
    message: string;
  }> {
    if (await this.getUserSubscriptionTier() === 'basic') {
      throw new Error('Trial features are only available for premium users.');
    }
    const doc = await this.db.collection('users').doc(userId).get();
    const userData = doc.data();
    
    if (!userData?.trialUsage) {
      return { 
        canUse: false,
        remainingPreviews: 0,
        remainingImports: 0,
        remainingEmails: 0,
        message: 'Trial not initialized'
      };
    }

    const trial = userData.trialUsage;
    const now = new Date();
    const lastReset = new Date(trial.lastReset);
    const isNewDay = lastReset.getDate() !== now.getDate();

    if (isNewDay) {
      await this.resetDailyUsage(userId);
      trial.emailsSent = 0;
    }

    const isExpired = new Date(trial.endDate) < now;
    const reachedPreviewLimit = trial.previewLeads >= LIMIT_CONFIG.TRIAL.PREVIEW_LEADS;
    const reachedImportLimit = trial.importedContacts >= LIMIT_CONFIG.TRIAL.IMPORTED_CONTACTS;
    const reachedDailyEmailLimit = trial.emailsSent >= LIMIT_CONFIG.TRIAL.EMAILS_PER_DAY;

    if (isExpired) {
      return {
        canUse: false,
        remainingPreviews: 0,
        remainingImports: 0,
        remainingEmails: 0,
        message: 'Trial period has expired. Upgrade to continue!'
      };
    }

    return {
      canUse: true,
      remainingPreviews: LIMIT_CONFIG.TRIAL.PREVIEW_LEADS - trial.previewLeads,
      remainingImports: LIMIT_CONFIG.TRIAL.IMPORTED_CONTACTS - trial.importedContacts,
      remainingEmails: LIMIT_CONFIG.TRIAL.EMAILS_PER_DAY - trial.emailsSent,
      message: 'Trial active'
    };
  }

  private async resetDailyUsage(userId: string): Promise<void> {
    await this.db.collection('users').doc(userId).update({
      'trialUsage.emailsSent': 0,
      'trialUsage.lastReset': new Date().toISOString()
    });
  }

  async trackUsage(userId: string, type: 'preview' | 'import' | 'email', count: number): Promise<void> {
    const userRef = this.db.collection('users').doc(userId);
    
    await this.db.runTransaction(async (transaction: Transaction) => {
      const doc = await transaction.get(userRef);
      const userData = doc.data();
      
      if (!userData) throw new Error('User not found');

      const updates: any = {};

      if (userData.trialUsage && this.isTrialActive(userData.trialUsage)) {
        switch (type) {
          case 'preview':
            updates['trialUsage.previewLeads'] = userData.trialUsage.previewLeads + count;
            break;
          case 'import':
            updates['trialUsage.importedContacts'] = userData.trialUsage.importedContacts + count;
            break;
          case 'email':
            updates['trialUsage.emailsSent'] = userData.trialUsage.emailsSent + count;
            break;
        }
      } else {
        // Handle paid user usage
        const creditsField = type === 'email' ? 'emailLimits' : 'smsLimits';
        const currentCredits = userData[creditsField] || 0;
        
        if (currentCredits < count) {
          throw new Error(`Insufficient ${type} limits`);
        }
        
        updates[creditsField] = currentCredits - count;
      }

      transaction.update(userRef, updates);
    });
  }

  private isTrialActive(trialUsage: any): boolean {
    return (
      new Date(trialUsage.endDate) > new Date() &&
      trialUsage.previewLeads < LIMIT_CONFIG.TRIAL.PREVIEW_LEADS &&
      trialUsage.importedContacts < LIMIT_CONFIG.TRIAL.IMPORTED_CONTACTS
    );
  }

  calculateExtraCreditPrice(type: 'EMAIL' | 'SMS', amount: number): {
    basePrice: number;
    discount: number;
    finalPrice: number;
    pricePerLimit: number;
  } {
    const config = LIMIT_CONFIG.EXTRA_LIMITS[type];
    
    if (amount < config.MIN_PURCHASE) {
      throw new Error(`Minimum purchase is ${config.MIN_PURCHASE} ${type.toLowerCase()} limits`);
    }

    const basePrice = amount * config.PRICE_PER_LIMIT;
    let discount = 0;

    // Find the highest applicable discount
    for (const tier of config.BULK_DISCOUNTS.sort((a: BulkDiscount, b: BulkDiscount) => b.amount - a.amount)) {
      if (amount >= tier.amount) {
        discount = basePrice * tier.discount;
        break;
      }
    }

    const finalPrice = basePrice - discount;
    const pricePerLimit = finalPrice / amount;

    return {
      basePrice,
      discount,
      finalPrice,
      pricePerLimit
    };
  }

  async purchaseExtraCredits(
    userId: string,
    type: 'email' | 'sms',
    amount: number,
    paymentId: string
  ): Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
  }> {
    const userRef = this.db.collection('users').doc(userId) as DocumentReference<DocumentData>;
    
    try {
      const result = await this.db.runTransaction(async (transaction: Transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data() as DocumentData;
        const creditsField = type === 'email' ? 'emailLimits' : 'smsLimits';
        const currentCredits = userData[creditsField] || 0;
        const newBalance = currentCredits + amount;

        // Update user limits
        transaction.update(userRef, {
          [creditsField]: newBalance,
          lastPurchase: new Date().toISOString()
        });

        // Record the transaction
        const transactionRef = this.db.collection('creditTransactions').doc() as DocumentReference<DocumentData>;
        transaction.set(transactionRef, {
          userId,
          type,
          amount,
          paymentId,
          timestamp: new Date().toISOString(),
          previousBalance: currentCredits,
          newBalance,
          source: 'extra_purchase'
        });

        return {
          success: true,
          newBalance,
          transactionId: transactionRef.id
        };
      });

      return result;
    } catch (error) {
      console.error('Error purchasing extra limits:', error);
      throw error;
    }
  }

  async getExtraCreditPurchaseHistory(userId: string): Promise<LimitTransaction[]> {
    try {
      const snapshot = await this.db.collection('creditTransactions')
        .where('userId', '==', userId)
        .where('source', '==', 'extra_purchase')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as Omit<LimitTransaction, 'id'>)
      }));
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  }
}

export { LIMIT_CONFIG }; 