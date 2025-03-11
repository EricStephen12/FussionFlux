import { db } from '@/utils/firebase';
import { doc, collection, updateDoc, getDoc, setDoc, query, where, getDocs, addDoc, increment, Timestamp, DocumentReference, orderBy, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestore';
import crypto from 'crypto';
import { creditsService } from './trial';
import { BillingService } from './billing';

interface ReferralReward {
  type: 'email_credits' | 'sms_credits' | 'lead_credits';
  amount: number;
  tier: 'free' | 'starter' | 'grower' | 'pro';
}

interface ReferralEarnings {
  totalEmailCredits: number;
  totalSMSCredits: number;
  totalLeadCredits: number;
  pendingCredits: {
    email: number;
    sms: number;
    leads: number;
  };
  history: Array<{
    id: string;
    type: 'email_credits' | 'sms_credits' | 'lead_credits';
    amount: number;
    date: Date;
    status: 'completed' | 'pending';
  }>;
}

interface ReferralProgram {
  referralCode: string;
  referralsCount: number;
  totalRewards: number;
  tier: 'free' | 'starter' | 'grower' | 'pro';
  lastReferralDate?: Date;
  earnings: ReferralEarnings;
  payoutMethod?: {
    type: 'paypal' | 'bank_transfer' | 'crypto';
    details: Record<string, string>;
  };
}

interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  status: 'pending' | 'completed';
  limitAmount: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  usageCount: number;
  active: boolean;
}

export interface ReferralTransaction {
  id: string;
  referrerId: string;
  referredUserId: string;
  type: 'signup' | 'subscription' | 'purchase';
  amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingCommission: number;
  totalEarned: number;
  conversionRate: number;
  recentTransactions: ReferralTransaction[];
}

export class ReferralService {
  private readonly REFERRAL_REWARDS = {
    free: {
      email_credits: 100,
      sms_credits: 50,
      lead_credits: 25
    },
    starter: {
      email_credits: 250,
      sms_credits: 100,
      lead_credits: 50
    },
    grower: {
      email_credits: 500,
      sms_credits: 200,
      lead_credits: 100
    },
    pro: {
      email_credits: 1000,
      sms_credits: 500,
      lead_credits: 250
    }
  };

  private readonly TIER_REQUIREMENTS = {
    free: 0,
    starter: 3,  // 3 successful referrals
    grower: 10,  // 10 successful referrals
    pro: 25      // 25 successful referrals
  };

  private readonly PAYOUT_THRESHOLD = 50; // Minimum $50 for payout
  private readonly REFERRAL_CODE_LENGTH = 8;

  private readonly referralsRef = collection(db, 'referrals');
  private readonly usersRef = collection(db, 'users');
  private readonly transactionsRef = collection(db, 'referralTransactions');
  private billingService = new BillingService();

  // Commission rates
  private readonly COMMISSION_RATES = {
    subscription: 0.20, // 20% of first payment
    purchase: 0.15     // 15% of purchase amount
  };

  async generateReferralCode(userId: string): Promise<ReferralCode> {
    try {
      // Generate a unique referral code using a combination of random string and timestamp
      const timestamp = Date.now().toString(36);
      const randomStr = crypto.randomBytes(4).toString('hex');
      const code = `${randomStr}${timestamp}`.slice(0, 8).toUpperCase();
      
      const referralCode: ReferralCode = {
        code,
        userId,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        active: true
      };

      // Store in users collection instead of referrals collection
      await updateDoc(doc(this.usersRef, userId), {
        referralCode: code
      });

      return referralCode;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }

  async getReferralCode(userId: string): Promise<ReferralCode | null> {
    try {
      const userDoc = await getDoc(doc(this.usersRef, userId));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      if (!userData.referralCode) {
        return null;
      }

      return {
        code: userData.referralCode,
        userId,
        createdAt: userData.createdAt || new Date().toISOString(),
        usageCount: userData.referralStats?.totalReferrals || 0,
        active: true
      };
    } catch (error) {
      console.error('Error getting referral code:', error);
      return null;
    }
  }

  async trackReferralSignup(referralCode: string, newUserId: string): Promise<void> {
    try {
      // Get the referrer's user document
      const q = query(this.usersRef, where('referralCode', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Invalid referral code');
      }

      const referrerDoc = snapshot.docs[0];
      const referrerId = referrerDoc.id;

      // Update referrer's stats
      await updateDoc(doc(this.usersRef, referrerId), {
        'referralStats.totalReferrals': increment(1),
        'referralStats.activeReferrals': increment(1)
      });

      // Update referred user's document
      await updateDoc(doc(this.usersRef, newUserId), {
        referredBy: referrerId
      });

      // Create transaction record
      const transaction: ReferralTransaction = {
        id: `ref_${Date.now()}`,
        referrerId,
        referredUserId: newUserId,
        type: 'signup',
        amount: 0,
        commission: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(this.transactionsRef, transaction.id), transaction);
    } catch (error) {
      console.error('Error tracking referral signup:', error);
      // Don't throw error to prevent blocking sign up
      // Just log it since referral tracking is not critical
    }
  }

  async processReferralCommission(
    userId: string,
    type: 'subscription' | 'purchase',
    amount: number
  ): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.usersRef, userId));
      const userData = userDoc.data();

      if (!userData?.referredBy) {
        return; // User wasn't referred
      }

      const commission = amount * this.COMMISSION_RATES[type];
      
      const transaction: ReferralTransaction = {
        id: `com_${Date.now()}`,
        referrerId: userData.referredBy,
        referredUserId: userId,
        type,
        amount,
        commission,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await Promise.all([
        // Store transaction
        setDoc(doc(this.transactionsRef, transaction.id), transaction),
        // Update referrer's pending commission
        updateDoc(doc(this.usersRef, userData.referredBy), {
          pendingCommission: increment(commission)
        })
      ]);
    } catch (error) {
      console.error('Error processing referral commission:', error);
      throw new Error('Failed to process referral commission');
    }
  }

  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    try {
      const userDoc = await getDoc(doc(this.usersRef, userId));
      const userData = userDoc.data();
      
      // Get recent transactions
      const q = query(
        this.transactionsRef,
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      
      return {
        totalReferrals: userData?.referralStats?.totalReferrals || 0,
        activeReferrals: userData?.referralStats?.activeReferrals || 0,
        pendingCommission: userData?.referralStats?.pendingCommission || 0,
        totalEarned: userData?.referralStats?.totalEarned || 0,
        conversionRate: userData?.referralStats?.conversionRate || 0,
        recentTransactions: snapshot.docs.map(doc => doc.data() as ReferralTransaction)
      };
    } catch (error) {
      console.error('Error getting affiliate stats:', error);
      throw new Error('Failed to get affiliate stats');
    }
  }

  async payoutCommission(transactionId: string): Promise<void> {
    try {
      const transactionDoc = await getDoc(doc(this.transactionsRef, transactionId));
      if (!transactionDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionDoc.data() as ReferralTransaction;
      if (transaction.status !== 'pending') {
        throw new Error('Transaction is not pending');
      }

      await Promise.all([
        // Update transaction status
        updateDoc(doc(this.transactionsRef, transactionId), {
          status: 'paid',
          paidAt: new Date().toISOString()
        }),
        // Update user's pending and total commission
        updateDoc(doc(this.usersRef, transaction.referrerId), {
          pendingCommission: increment(-transaction.commission),
          totalCommission: increment(transaction.commission)
        })
      ]);
    } catch (error) {
      console.error('Error processing payout:', error);
      throw new Error('Failed to process payout');
    }
  }

  async createReferral(referrerId: string, referredUserId: string): Promise<void> {
    try {
      // Check if referral already exists
      const existingReferral = await this.getReferralByReferredUser(referredUserId);
      if (existingReferral) throw new Error('User already referred');

      // Create new referral
      await addDoc(this.referralsRef, {
        referrerId,
        referredUserId,
        status: 'pending',
        limitAmount: 50, // Default limit amount
        createdAt: new Date()
      });

      // Update referrer's stats
      const referrerDoc = await getDoc(doc(this.usersRef, referrerId));
      const stats = referrerDoc.data()?.referralStats || {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        earnedLimits: 0
      };

      await updateDoc(doc(this.usersRef, referrerId), {
        referralStats: {
          ...stats,
          totalReferrals: stats.totalReferrals + 1,
          pendingReferrals: stats.pendingReferrals + 1
        }
      });
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  async completeReferral(referralId: string): Promise<void> {
    try {
      const referralDoc = await getDoc(doc(this.referralsRef, referralId));
      if (!referralDoc.exists()) throw new Error('Referral not found');

      const referral = referralDoc.data() as Referral;
      if (referral.status === 'completed') return;

      // Update referral status
      await updateDoc(doc(this.referralsRef, referralId), {
        status: 'completed',
        completedAt: new Date()
      });

      // Update referrer's stats and add limits
      const referrerDoc = await getDoc(doc(this.usersRef, referral.referrerId));
      const stats = referrerDoc.data()?.referralStats;

      await updateDoc(doc(this.usersRef, referral.referrerId), {
        referralStats: {
          ...stats,
          pendingReferrals: stats.pendingReferrals - 1,
          completedReferrals: stats.completedReferrals + 1,
          earnedLimits: stats.earnedLimits + referral.limitAmount
        }
      });

      // Add limits to referrer
      await this.billingService.addLimits(
        referral.referrerId,
        referral.limitAmount,
        `referral_${referralId}`
      );
    } catch (error) {
      console.error('Error completing referral:', error);
      throw error;
    }
  }

  async getReferralByReferredUser(userId: string): Promise<Referral | null> {
    try {
      const q = query(this.referralsRef, where('referredUserId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Referral;
    } catch (error) {
      console.error('Error getting referral:', error);
      throw error;
    }
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const q = query(this.referralsRef, where('referrerId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Referral[];
    } catch (error) {
      console.error('Error getting user referrals:', error);
      throw error;
    }
  }

  async getReferralStats(userId: string) {
    try {
      const userDoc = await getDoc(doc(this.usersRef, userId));
      if (!userDoc.exists()) throw new Error('User not found');

      return userDoc.data()?.referralStats || {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        earnedLimits: 0
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  }

  async processReferral(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      // Find referrer
      const referralQuery = query(
        collection(db, 'referral_programs'),
        where('referralCode', '==', referralCode)
      );
      const referralDocs = await getDocs(referralQuery);

      if (referralDocs.empty) {
        return false;
      }

      const referralDoc = referralDocs.docs[0];
      const referrerId = referralDoc.id;

      // Prevent self-referral
      if (referrerId === newUserId) {
        return false;
      }

      // Check if user was already referred
      const userDoc = await getDoc(doc(db, 'users', newUserId));
      if (userDoc.exists() && userDoc.data().referredBy) {
        return false;
      }

      const referralProgram = referralDoc.data() as ReferralProgram;
      const newTier = this.determineUserTier(referralProgram.referralsCount + 1);
      const rewards = this.REFERRAL_REWARDS[newTier];

      // Update referrer's program
      const updatedEarnings = {
        ...referralProgram.earnings,
        totalEmailCredits: (referralProgram.earnings.totalEmailCredits || 0) + rewards.email_credits,
        totalSMSCredits: (referralProgram.earnings.totalSMSCredits || 0) + rewards.sms_credits,
        totalLeadCredits: (referralProgram.earnings.totalLeadCredits || 0) + rewards.lead_credits,
        pendingCredits: {
          email: (referralProgram.earnings.pendingCredits?.email || 0) + rewards.email_credits,
          sms: (referralProgram.earnings.pendingCredits?.sms || 0) + rewards.sms_credits,
          leads: (referralProgram.earnings.pendingCredits?.leads || 0) + rewards.lead_credits
        },
      };

      await updateDoc(doc(db, 'referral_programs', referrerId), {
        referralsCount: referralProgram.referralsCount + 1,
        totalRewards: (referralProgram.totalRewards || 0) + rewards.email_credits + rewards.sms_credits + rewards.lead_credits,
        tier: newTier,
        lastReferralDate: new Date(),
        earnings: updatedEarnings,
      });

      // Record the referral
      await this.recordReferralTransaction(referrerId, newUserId, rewards);

      // Update referred user
      await updateDoc(doc(db, 'users', newUserId), {
        referredBy: referrerId,
        referralDate: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }

  private determineUserTier(referralsCount: number): 'free' | 'starter' | 'grower' | 'pro' {
    if (referralsCount >= this.TIER_REQUIREMENTS.pro) return 'pro';
    if (referralsCount >= this.TIER_REQUIREMENTS.grower) return 'grower';
    if (referralsCount >= this.TIER_REQUIREMENTS.starter) return 'starter';
    return 'free';
  }

  private async recordReferralTransaction(
    referrerId: string,
    referredId: string,
    rewards: typeof this.REFERRAL_REWARDS.free
  ) {
    await setDoc(doc(collection(db, 'referral_transactions'), uuidv4()), {
      referrerId,
      referredId,
      emailCredits: rewards.email_credits,
      smsCredits: rewards.sms_credits,
      leadCredits: rewards.lead_credits,
      status: 'completed',
      timestamp: new Date(),
    });
  }

  async getReferralHistory(userId: string): Promise<any[]> {
    try {
      const referralsQuery = query(
        collection(db, 'referral_transactions'),
        where('referrerId', '==', userId)
      );
      const snapshot = await getDocs(referralsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting referral history:', error);
      return [];
    }
  }

  async updatePayoutMethod(
    userId: string,
    method: {
      type: 'paypal' | 'bank_transfer' | 'crypto';
      details: Record<string, string>;
    }
  ): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'referral_programs', userId), {
        payoutMethod: method,
      });
      return true;
    } catch (error) {
      console.error('Error updating payout method:', error);
      return false;
    }
  }

  async requestPayout(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const program = await this.getReferralStats(userId);
      if (!program) {
        return { success: false, error: 'Referral program not found' };
      }

      if (!program.payoutMethod) {
        return { success: false, error: 'No payout method configured' };
      }

      const pendingAmount = program.earnings.pendingCredits.email + program.earnings.pendingCredits.sms + program.earnings.pendingCredits.leads;
      if (pendingAmount < this.PAYOUT_THRESHOLD) {
        return { 
          success: false, 
          error: `Minimum payout amount is $${this.PAYOUT_THRESHOLD}` 
        };
      }

      const payoutId = uuidv4();
      const payout = {
        id: payoutId,
        amount: pendingAmount,
        date: new Date(),
        method: program.payoutMethod.type,
        status: 'pending' as const,
      };

      // Update program with new payout record
      const updatedHistory = [...(program.earnings.history || []), payout];
      await updateDoc(doc(db, 'referral_programs', userId), {
        'earnings.pendingCredits.email': 0,
        'earnings.pendingCredits.sms': 0,
        'earnings.pendingCredits.leads': 0,
        'earnings.history': updatedHistory,
      });

      // Create payout record
      await setDoc(doc(db, 'payouts', payoutId), {
        userId,
        amount: pendingAmount,
        method: program.payoutMethod,
        status: 'pending',
        requestedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error requesting payout:', error);
      return { success: false, error: 'Failed to process payout request' };
    }
  }

  async updatePayoutStatus(
    userId: string,
    payoutId: string,
    update: {
      status: 'processing' | 'completed' | 'failed';
      paymentDetails?: Record<string, any>;
    }
  ): Promise<boolean> {
    try {
      const program = await this.getReferralStats(userId);
      if (!program) return false;

      const updatedHistory = program.earnings.history.map(payout =>
        payout.id === payoutId
          ? {
              ...payout,
              status: update.status,
              paymentDetails: update.paymentDetails,
              updatedAt: new Date(),
            }
          : payout
      );

      await updateDoc(doc(db, 'referral_programs', userId), {
        'earnings.history': updatedHistory,
        ...(update.status === 'completed' && {
          'earnings.lastPayout': {
            amount: program.earnings.history.find(p => p.id === payoutId)?.amount || 0,
            date: new Date(),
            method: program.payoutMethod?.type || 'unknown',
          },
        }),
      });

      // If payment failed, add the amount back to pending credits
      if (update.status === 'failed') {
        const failedAmount = program.earnings.history.find(
          p => p.id === payoutId
        )?.amount || 0;
        
        await updateDoc(doc(db, 'referral_programs', userId), {
          'earnings.pendingCredits.email': program.earnings.pendingCredits.email + failedAmount,
          'earnings.pendingCredits.sms': program.earnings.pendingCredits.sms + failedAmount,
          'earnings.pendingCredits.leads': program.earnings.pendingCredits.leads + failedAmount,
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating payout status:', error);
      return false;
    }
  }

  getTierBenefits() {
    return {
      free: {
        reward: `$${this.REFERRAL_REWARDS.free.email_credits + this.REFERRAL_REWARDS.free.sms_credits + this.REFERRAL_REWARDS.free.lead_credits}`,
        requirements: 'No minimum referrals',
        features: ['Instant rewards', 'Basic tracking'],
      },
      starter: {
        reward: `$${this.REFERRAL_REWARDS.starter.email_credits + this.REFERRAL_REWARDS.starter.sms_credits + this.REFERRAL_REWARDS.starter.lead_credits}`,
        requirements: `${this.TIER_REQUIREMENTS.starter}+ successful referrals`,
        features: ['Higher rewards', 'Priority support', 'Detailed analytics'],
      },
      grower: {
        reward: `$${this.REFERRAL_REWARDS.grower.email_credits + this.REFERRAL_REWARDS.grower.sms_credits + this.REFERRAL_REWARDS.grower.lead_credits}`,
        requirements: `${this.TIER_REQUIREMENTS.grower}+ successful referrals`,
        features: ['Maximum rewards', 'VIP support', 'Advanced analytics', 'Early access to features'],
      },
      pro: {
        reward: `$${this.REFERRAL_REWARDS.pro.email_credits + this.REFERRAL_REWARDS.pro.sms_credits + this.REFERRAL_REWARDS.pro.lead_credits}`,
        requirements: `${this.TIER_REQUIREMENTS.pro}+ successful referrals`,
        features: ['Maximum rewards', 'VIP support', 'Advanced analytics', 'Early access to features'],
      },
    };
  }

  async processReferralReward(
    userId: string,
    type: 'signup' | 'subscription' | 'purchase'
  ): Promise<void> {
    try {
      const userRef = doc(this.usersRef, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const referralsCount = (await this.getUserReferrals(userId)).length;
      const tier = this.determineUserTier(referralsCount);
      const rewards = this.REFERRAL_REWARDS[tier];

      // Add credits to user's account
      await updateDoc(userRef, {
        'extraCredits.extraEmails': increment(rewards.email_credits),
        'extraCredits.extraSMS': increment(rewards.sms_credits),
        'extraCredits.extraLeads': increment(rewards.lead_credits)
      });

      // Record the reward transaction
      await addDoc(this.transactionsRef, {
        referrerId: userId,
        type: 'reward',
        emailCredits: rewards.email_credits,
        smsCredits: rewards.sms_credits,
        leadCredits: rewards.lead_credits,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing referral reward:', error);
      throw error;
    }
  }
}

export const referralService = new ReferralService();
export type { ReferralProgram, ReferralReward, ReferralEarnings }; 