import { db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy as fsOrderBy, DocumentData, CollectionReference } from 'firebase/firestore';
import type { ApolloContact } from './apollo';
import { Timestamp } from 'firebase/firestore';

interface Campaign {
  id?: string;
  name: string;
  niche: string;
  totalEmails: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  userId: string;
  contacts: ApolloContact[];
  sentCount?: number;
  openCount?: number;
  clickCount?: number;
  lastSentAt?: string;
  scheduledFor?: string;
}

interface Transaction {
  userId: string;
  transactionId: string;
  paymentMethod: 'flutterwave' | 'paypal';
  planId: string;
  credits: number;
  timestamp: Date;
}

export class FirestoreService {
  private campaignsRef: CollectionReference;
  private usersRef: CollectionReference;

  constructor() {
    this.campaignsRef = collection(db, 'campaigns');
    this.usersRef = collection(db, 'users');
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.campaignsRef, {
        ...campaign,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Create campaign error:', error);
      throw new Error('Failed to create campaign');
    }
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    try {
      const q = query(
        this.campaignsRef,
        where('userId', '==', userId),
        fsOrderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];
    } catch (error) {
      console.error('Get user campaigns error:', error);
      return [];
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const docRef = doc(this.campaignsRef, campaignId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Campaign;
      }
      return null;
    } catch (error) {
      console.error('Get campaign error:', error);
      return null;
    }
  }

  async updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<void> {
    try {
      const docRef = doc(this.campaignsRef, campaignId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Update campaign error:', error);
      throw new Error('Failed to update campaign');
    }
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      const docRef = doc(this.campaignsRef, campaignId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Delete campaign error:', error);
      throw new Error('Failed to delete campaign');
    }
  }

  async updateCampaignStatus(
    campaignId: string,
    status: Campaign['status']
  ): Promise<void> {
    try {
      const docRef = doc(this.campaignsRef, campaignId);
      await updateDoc(docRef, {
        status,
        ...(status === 'completed' && { completedAt: new Date().toISOString() }),
      });
    } catch (error) {
      console.error('Update campaign status error:', error);
      throw new Error('Failed to update campaign status');
    }
  }

  async incrementCampaignStats(
    campaignId: string,
    stats: {
      sentCount?: number;
      openCount?: number;
      clickCount?: number;
    }
  ): Promise<void> {
    try {
      const docRef = doc(this.campaignsRef, campaignId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Campaign not found');
      }

      const data = docSnap.data();
      await updateDoc(docRef, {
        sentCount: (data.sentCount || 0) + (stats.sentCount || 0),
        openCount: (data.openCount || 0) + (stats.openCount || 0),
        clickCount: (data.clickCount || 0) + (stats.clickCount || 0),
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Increment campaign stats error:', error);
      throw new Error('Failed to update campaign stats');
    }
  }

  async updateUserCredits(userId: string, creditsToAdd: number): Promise<void> {
    try {
      const docRef = doc(this.usersRef, userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('User document not found');
      }

      const currentCredits = docSnap.data().credits || 0;
      await updateDoc(docRef, {
        credits: currentCredits + creditsToAdd,
        lastCreditUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update user credits error:', error);
      throw new Error('Failed to update user credits');
    }
  }

  async deductUserCredits(userId: string, creditsToDeduct: number): Promise<boolean> {
    try {
      const docRef = doc(this.usersRef, userId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('User document not found');
      }

      const currentCredits = docSnap.data().credits || 0;
      if (currentCredits < creditsToDeduct) {
        return false;
      }

      await updateDoc(docRef, {
        credits: currentCredits - creditsToDeduct,
        lastCreditUpdate: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Deduct user credits error:', error);
      return false;
    }
  }

  async getUserCredits(userId: string): Promise<number> {
    try {
      const docRef = doc(this.usersRef, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data().credits || 0) : 0;
    } catch (error) {
      console.error('Get user credits error:', error);
      return 0;
    }
  }

  async recordTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactionsRef = collection(db, 'transactions');
      await addDoc(transactionsRef, transaction);
    } catch (error) {
      console.error('Record transaction error:', error);
      throw new Error('Failed to record transaction');
    }
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        fsOrderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data()) as Transaction[];
    } catch (error) {
      console.error('Get user transactions error:', error);
      return [];
    }
  }

  async addDocument(collection: string, data: any): Promise<string> {
    try {
      const collectionRef = collection(db, collection);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Add document error:', error);
      throw new Error('Failed to add document');
    }
  }

  async getUserDocument(userId: string): Promise<any> {
    try {
      const docRef = doc(this.usersRef, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      }
      return null;
    } catch (error) {
      console.error('Get user document error:', error);
      return null;
    }
  }

  async updateUserDocument(userId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.usersRef, userId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update user document error:', error);
      throw new Error('Failed to update user document');
    }
  }

  async createUserDocument(userId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.usersRef, userId);
      await updateDoc(docRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Create user document error:', error);
      throw new Error('Failed to create user document');
    }
  }

  async getDashboardStats(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const statsDoc = await getDoc(doc(db, 'stats', userId));
      
      if (!userDoc.exists() || !statsDoc.exists()) {
        throw new Error('User stats not found');
      }

      const userData = userDoc.data();
      const statsData = statsDoc.data();

      return {
        totalCampaigns: statsData.totalCampaigns || 0,
        activeCampaigns: statsData.activeCampaigns || 0,
        totalEmails: statsData.totalEmails || 0,
        openRate: statsData.openRate || 0,
        subscribers: statsData.subscribers || 0,
        revenue: statsData.revenue || 0,
        revenueGrowth: statsData.revenueGrowth || 0,
        conversionRate: statsData.conversionRate || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getRecentActivity(userId: string) {
    try {
      const activityRef = collection(db, 'users', userId, 'activity');
      const q = query(
        activityRef,
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: this.formatTimestamp(doc.data().timestamp),
      }));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  async getPerformanceData(userId: string) {
    try {
      const performanceRef = collection(db, 'users', userId, 'performance');
      
      // Get daily data
      const dailyQuery = query(
        performanceRef,
        where('type', '==', 'daily'),
        orderBy('date', 'desc'),
        limit(7)
      );
      
      // Get weekly data
      const weeklyQuery = query(
        performanceRef,
        where('type', '==', 'weekly'),
        orderBy('date', 'desc'),
        limit(4)
      );

      const [dailySnapshot, weeklySnapshot] = await Promise.all([
        getDocs(dailyQuery),
        getDocs(weeklyQuery),
      ]);

      return {
        daily: dailySnapshot.docs.map(doc => ({
          date: this.formatDate(doc.data().date),
          ...doc.data(),
        })).reverse(),
        weekly: weeklySnapshot.docs.map(doc => ({
          date: this.formatDate(doc.data().date),
          ...doc.data(),
        })).reverse(),
      };
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  }

  async getTrialStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const trialStart = userData.trialStartDate?.toDate() || new Date();
      const trialDays = 14; // 14-day trial
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, trialDays - daysElapsed);
      
      return {
        daysRemaining,
        usedFeatures: userData.usedFeatures || 0,
        totalFeatures: userData.totalFeatures || 5,
        trialProgress: Math.min(100, Math.round((daysElapsed / trialDays) * 100)),
      };
    } catch (error) {
      console.error('Error fetching trial status:', error);
      throw error;
    }
  }

  private formatTimestamp(timestamp: Timestamp): string {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  }

  private formatDate(date: Timestamp): string {
    if (!date) return '';
    return date.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export const firestoreService = new FirestoreService();
export type { Campaign, Transaction }; 