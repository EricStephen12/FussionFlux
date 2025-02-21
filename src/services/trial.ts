import { db } from '@/utils/firebase';

interface UserCredits {
  userId: string;
  credits: number;
  lastPurchase?: Date;
  trialUsage?: {
    dailyContacts: number;
    totalContacts: number;
    lastReset: string;
    startDate: string;
    endDate: string;
  };
}

const CREDIT_CONFIG = {
  PACKAGES: [
    { 
      credits: 1000,
      price: 4.99,
      features: ['Basic targeting', 'Standard templates', 'Basic analytics']
    },    // $0.005 per contact - Starter
    { 
      credits: 5000,
      price: 14.99,
      features: ['Advanced targeting', 'A/B testing', 'Detailed analytics']
    },  // $0.003 per contact - Popular
    { 
      credits: 15000,
      price: 29.99,
      features: ['Premium targeting', 'All templates', 'Full analytics suite']
    },  // $0.002 per contact - Professional
    { 
      credits: 50000,
      price: 49.99,
      features: ['Ultra targeting', 'Priority support', 'ROI tracking']
    }   // $0.001 per contact - Business
  ],
  TRIAL: {
    DAILY_LIMIT: 5,
    TOTAL_LIMIT: 25,
    DURATION_DAYS: 5,
    FEATURES: ['basic_targeting', 'email_templates', 'campaign_tracking']
  },
  MIN_PURCHASE: 1000,
  CONVERSION_METRICS: {
    EXPECTED_OPEN_RATE: 0.25, // 25% open rate for targeted dropshipping
    EXPECTED_CLICK_RATE: 0.08, // 8% click rate for e-commerce
    EXPECTED_CONVERSION: 0.02, // 2% conversion rate (industry standard for dropshipping)
    AVG_ORDER_VALUE: 35, // Average order value in USD
  }
};

class CreditsService {
  async initializeUser(userId: string): Promise<void> {
    try {
      await db.collection('users').doc(userId).set({
        credits: 0,
        createdAt: new Date().toISOString(),
        trialUsage: {
          dailyContacts: 0,
          totalContacts: 0,
          lastReset: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + (CREDIT_CONFIG.TRIAL.DURATION_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        }
      });
    } catch (error) {
      console.error('Initialize user error:', error);
      throw new Error('Failed to initialize user');
    }
  }

  async getUserCredits(userId: string): Promise<number> {
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.exists ? (doc.data()?.credits || 0) : 0;
    } catch (error) {
      console.error('Get user credits error:', error);
      return 0;
    }
  }

  async addCredits(userId: string, packageId: number): Promise<boolean> {
    try {
      const creditPackage = CREDIT_CONFIG.PACKAGES[packageId];
      if (!creditPackage) return false;

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) return false;

      const currentCredits = userDoc.data()?.credits || 0;
      await userRef.update({
        credits: currentCredits + creditPackage.credits,
        lastPurchase: new Date().toISOString()
      });

      // Record the purchase
      await this.recordPurchase(userId, creditPackage);

      return true;
    } catch (error) {
      console.error('Add credits error:', error);
      return false;
    }
  }

  private async recordPurchase(userId: string, package_: typeof CREDIT_CONFIG.PACKAGES[0]) {
    try {
      await db.collection('purchases').add({
        userId,
        credits: package_.credits,
        amount: package_.price,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Record purchase error:', error);
      throw new Error('Failed to record purchase');
    }
  }

  async deductCredits(userId: string, amount: number): Promise<boolean> {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists()) return false;
    
    const currentCredits = userDoc.data()?.credits || 0;
    if (currentCredits < amount) return false;

    await userRef.update({
      credits: currentCredits - amount
    });

    return true;
  }

  getCreditPackages() {
    return CREDIT_CONFIG.PACKAGES;
  }

  getMinimumPurchase() {
    return CREDIT_CONFIG.MIN_PURCHASE;
  }

  async checkTrialEligibility(userId: string): Promise<{
    canUse: boolean;
    remaining: number;
    message: string;
  }> {
    const doc = await db.collection('users').doc(userId).get();
    const userData = doc.data();
    
    if (!userData?.trialUsage) {
      return { canUse: false, remaining: 0, message: 'Trial not initialized' };
    }

    const trial = userData.trialUsage;
    const now = new Date();
    const lastReset = new Date(trial.lastReset);

    // Reset daily usage if it's a new day
    if (lastReset.getDate() !== now.getDate()) {
      await this.resetDailyUsage(userId);
      trial.dailyContacts = 0;
    }

    const isExpired = new Date(trial.endDate) < now;
    const reachedDaily = trial.dailyContacts >= CREDIT_CONFIG.TRIAL.DAILY_LIMIT;
    const reachedTotal = trial.totalContacts >= CREDIT_CONFIG.TRIAL.TOTAL_LIMIT;

    if (isExpired) {
      return {
        canUse: false,
        remaining: 0,
        message: 'Trial period has expired. Upgrade to continue!'
      };
    }

    if (reachedTotal) {
      return {
        canUse: false,
        remaining: 0,
        message: 'Trial limit reached. Upgrade to unlock unlimited access!'
      };
    }

    if (reachedDaily) {
      return {
        canUse: false,
        remaining: CREDIT_CONFIG.TRIAL.TOTAL_LIMIT - trial.totalContacts,
        message: 'Daily limit reached. Come back tomorrow or upgrade now!'
      };
    }

    return {
      canUse: true,
      remaining: Math.min(
        CREDIT_CONFIG.TRIAL.DAILY_LIMIT - trial.dailyContacts,
        CREDIT_CONFIG.TRIAL.TOTAL_LIMIT - trial.totalContacts
      ),
      message: 'Trial active'
    };
  }

  private async resetDailyUsage(userId: string): Promise<void> {
    await db.collection('users').doc(userId).update({
      'trialUsage.dailyContacts': 0,
      'trialUsage.lastReset': new Date().toISOString()
    });
  }

  async trackTrialUsage(userId: string, contactsUsed: number): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      const userData = doc.data();
      
      if (!userData?.trialUsage) throw new Error('Trial not initialized');

      transaction.update(userRef, {
        'trialUsage.dailyContacts': userData.trialUsage.dailyContacts + contactsUsed,
        'trialUsage.totalContacts': userData.trialUsage.totalContacts + contactsUsed
      });
    });
  }
}

export const creditsService = new CreditsService();
export { CREDIT_CONFIG }; 