import { db } from '@/utils/firebase';
import { doc, collection, updateDoc, getDoc, setDoc, query, where, getDocs, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { firestoreService } from './firestore';
import crypto from 'crypto';
import { creditsService } from './trial';
import { BillingService } from './billing';

interface ReferralReward {
  type: 'credits' | 'cash';
  amount: number;
  tier: 'basic' | 'premium' | 'elite';
}

interface ReferralEarnings {
  totalEarned: number;
  pendingPayout: number;
  lastPayout: {
    amount: number;
    date: Date;
    method: string;
  } | null;
  payoutHistory: Array<{
    id: string;
    amount: number;
    date: Date;
    method: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

interface ReferralProgram {
  referralCode: string;
  referralsCount: number;
  totalRewards: number;
  tier: 'basic' | 'premium' | 'elite';
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
  creditAmount: number;
  createdAt: Date;
  completedAt?: Date;
}

export class ReferralService {
  private readonly REFERRAL_REWARDS = {
    basic: {
      type: 'cash' as const,
      amount: 5, // $5 per referral
      tier: 'basic' as const,
    },
    premium: {
      type: 'cash' as const,
      amount: 10, // $10 per referral
      tier: 'premium' as const,
    },
    elite: {
      type: 'cash' as const,
      amount: 20, // $20 per referral
      tier: 'elite' as const,
    },
  };

  private readonly TIER_REQUIREMENTS = {
    basic: 0,
    premium: 5, // 5 successful referrals
    elite: 15, // 15 successful referrals
  };

  private readonly PAYOUT_THRESHOLD = 50; // Minimum $50 for payout
  private readonly REFERRAL_CODE_LENGTH = 8;

  private referralsRef = collection(db, 'referrals');
  private usersRef = collection(db, 'users');
  private billingService = new BillingService();

  async generateReferralCode(userId: string): Promise<string> {
    try {
      const userDoc = await getDoc(doc(this.usersRef, userId));
      if (!userDoc.exists()) throw new Error('User not found');

      const referralCode = this.generateUniqueCode();
      await updateDoc(doc(this.usersRef, userId), {
        referralCode,
        referralStats: {
          totalReferrals: 0,
          pendingReferrals: 0,
          completedReferrals: 0,
          earnedCredits: 0
        }
      });

      return referralCode;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  private generateUniqueCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
        creditAmount: 50, // Default credit amount
        createdAt: new Date()
      });

      // Update referrer's stats
      const referrerDoc = await getDoc(doc(this.usersRef, referrerId));
      const stats = referrerDoc.data()?.referralStats || {
        totalReferrals: 0,
        pendingReferrals: 0,
        completedReferrals: 0,
        earnedCredits: 0
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

      // Update referrer's stats and add credits
      const referrerDoc = await getDoc(doc(this.usersRef, referral.referrerId));
      const stats = referrerDoc.data()?.referralStats;

      await updateDoc(doc(this.usersRef, referral.referrerId), {
        referralStats: {
          ...stats,
          pendingReferrals: stats.pendingReferrals - 1,
          completedReferrals: stats.completedReferrals + 1,
          earnedCredits: stats.earnedCredits + referral.creditAmount
        }
      });

      // Add credits to referrer
      await this.billingService.addCredits(
        referral.referrerId,
        referral.creditAmount,
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
        earnedCredits: 0
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
        totalEarned: (referralProgram.earnings.totalEarned || 0) + rewards.amount,
        pendingPayout: (referralProgram.earnings.pendingPayout || 0) + rewards.amount,
      };

      await updateDoc(doc(db, 'referral_programs', referrerId), {
        referralsCount: referralProgram.referralsCount + 1,
        totalRewards: (referralProgram.totalRewards || 0) + rewards.amount,
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

  private determineUserTier(referralsCount: number): 'basic' | 'premium' | 'elite' {
    if (referralsCount >= this.TIER_REQUIREMENTS.elite) return 'elite';
    if (referralsCount >= this.TIER_REQUIREMENTS.premium) return 'premium';
    return 'basic';
  }

  private async recordReferralTransaction(
    referrerId: string,
    referredId: string,
    rewards: typeof this.REFERRAL_REWARDS.basic
  ) {
    await setDoc(doc(collection(db, 'referral_transactions'), uuidv4()), {
      referrerId,
      referredId,
      amount: rewards.amount,
      tier: rewards.tier,
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

      const pendingAmount = program.earnings.pendingPayout;
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
      const updatedPayoutHistory = [...(program.earnings.payoutHistory || []), payout];
      await updateDoc(doc(db, 'referral_programs', userId), {
        'earnings.pendingPayout': 0,
        'earnings.payoutHistory': updatedPayoutHistory,
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

      const updatedPayoutHistory = program.earnings.payoutHistory.map(payout =>
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
        'earnings.payoutHistory': updatedPayoutHistory,
        ...(update.status === 'completed' && {
          'earnings.lastPayout': {
            amount: program.earnings.payoutHistory.find(p => p.id === payoutId)?.amount || 0,
            date: new Date(),
            method: program.payoutMethod?.type || 'unknown',
          },
        }),
      });

      // If payment failed, add the amount back to pending payout
      if (update.status === 'failed') {
        const failedAmount = program.earnings.payoutHistory.find(
          p => p.id === payoutId
        )?.amount || 0;
        
        await updateDoc(doc(db, 'referral_programs', userId), {
          'earnings.pendingPayout': program.earnings.pendingPayout + failedAmount,
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
      basic: {
        reward: `$${this.REFERRAL_REWARDS.basic.amount} per referral`,
        requirements: 'No minimum referrals',
        features: ['Instant rewards', 'Basic tracking'],
      },
      premium: {
        reward: `$${this.REFERRAL_REWARDS.premium.amount} per referral`,
        requirements: `${this.TIER_REQUIREMENTS.premium}+ successful referrals`,
        features: ['Higher rewards', 'Priority support', 'Detailed analytics'],
      },
      elite: {
        reward: `$${this.REFERRAL_REWARDS.elite.amount} per referral`,
        requirements: `${this.TIER_REQUIREMENTS.elite}+ successful referrals`,
        features: ['Maximum rewards', 'VIP support', 'Advanced analytics', 'Early access to features'],
      },
    };
  }
}

export const referralService = new ReferralService();
export type { ReferralProgram, ReferralReward, ReferralEarnings }; 