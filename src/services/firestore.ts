import { db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy as fsOrderBy, DocumentData, CollectionReference, limit, Timestamp, onSnapshot, setDoc } from 'firebase/firestore';
import type { ApolloContact } from './apollo';
import { auth } from '@/utils/firebase';
import { docToJSON } from '@/utils/firebase-client';

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  blocks: any[];
  templateName?: string;
  leads: any[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'error';
  scheduledDate: Date;
  createdAt: Date;
  sentCount?: number;
  openCount?: number;
  clickCount?: number;
  bounceCount?: number;
  unsubscribeCount?: number;
  complaintsCount?: number;
  firstOpenAt?: string;
  firstClickAt?: string;
  lastActivityAt?: string;
  engagementData?: any[];
  recommendedActions?: string[];
  abTesting?: {
    enabled: boolean;
    subjectB: string;
    testRatio: number;
    testWinnerMetric: 'open' | 'click';
    testDuration: number;
    testStatus: 'pending' | 'running' | 'completed';
    testStartTime: string | null;
    testEndTime: string | null;
    winningSubject: string | null;
    variantAStats: {
      sent: number;
      opened: number;
      clicked: number;
      openRate: number;
      clickRate: number;
    };
    variantBStats: {
      sent: number;
      opened: number;
      clicked: number;
      openRate: number;
      clickRate: number;
    };
  };
}

interface Transaction {
  userId: string;
  transactionId: string;
  paymentMethod: 'flutterwave' | 'paypal';
  planId: string;
  limits: number;
  timestamp: Date;
}

export class FirestoreService {
  private campaignsRef: CollectionReference;
  private usersRef: CollectionReference;
  private transactionsRef: CollectionReference;

  constructor() {
    this.campaignsRef = collection(db, 'campaigns');
    this.usersRef = collection(db, 'users');
    this.transactionsRef = collection(db, 'transactions');
  }

  // Helper method to get a collection reference
  private getCollectionRef(collectionName: string): CollectionReference {
    switch (collectionName) {
      case 'campaigns':
        return this.campaignsRef;
      case 'users':
        return this.usersRef;
      case 'transactions':
        return this.transactionsRef;
      default:
        return collection(db, collectionName);
    }
  }

  async createCampaign(campaign: Campaign): Promise<void> {
    const campaignRef = await addDoc(this.campaignsRef, campaign);
    console.log('Campaign created with ID:', campaignRef.id);
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
    const campaignDoc = await getDoc(doc(this.campaignsRef, campaignId));
    return campaignDoc.exists() ? { id: campaignDoc.id, ...campaignDoc.data() } as Campaign : null;
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

  async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      const collectionRef = this.getCollectionRef(collectionName);
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
      const q = query(this.campaignsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      let totalEmails = 0;
      let totalOpens = 0;
      let totalClicks = 0;
      let totalCampaigns = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        totalEmails += data.sentCount || 0;
        totalOpens += data.openCount || 0;
        totalClicks += data.clickCount || 0;
        totalCampaigns++;
      });

      return {
        totalCampaigns,
        totalEmails,
        openRate: totalEmails > 0 ? (totalOpens / totalEmails) * 100 : 0,
        conversionRate: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalCampaigns: 0,
        totalEmails: 0,
        openRate: 0,
        conversionRate: 0,
      };
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
      const q = query(
        this.campaignsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        fsOrderBy('createdAt', 'desc'),
        limit(30)
      );

      const querySnapshot = await getDocs(q);
      const campaigns = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Process daily data
      const dailyData = campaigns.reduce((acc: any[], campaign: any) => {
        const date = new Date(campaign.createdAt).toLocaleDateString();
        const existingDay = acc.find(d => d.date === date);

        if (existingDay) {
          existingDay.opens += campaign.openCount || 0;
          existingDay.clicks += campaign.clickCount || 0;
          existingDay.conversions += campaign.conversionCount || 0;
        } else {
          acc.push({
            date,
            opens: campaign.openCount || 0,
            clicks: campaign.clickCount || 0,
            conversions: campaign.conversionCount || 0,
          });
        }
        return acc;
      }, []);

      // Process weekly data
      const weeklyData = campaigns.reduce((acc: any[], campaign: any) => {
        const date = new Date(campaign.createdAt);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toLocaleDateString();
        const existingWeek = acc.find(w => w.date === weekStart);

        if (existingWeek) {
          existingWeek.campaigns++;
          existingWeek.engagement += (campaign.openCount || 0) + (campaign.clickCount || 0);
        } else {
          acc.push({
            date: weekStart,
            campaigns: 1,
            engagement: (campaign.openCount || 0) + (campaign.clickCount || 0),
          });
        }
        return acc;
      }, []);

      return {
        daily: dailyData.slice(0, 7).reverse(), // Last 7 days
        weekly: weeklyData.slice(0, 4).reverse(), // Last 4 weeks
      };
    } catch (error) {
      console.error('Error getting performance data:', error);
      return {
        daily: [],
        weekly: [],
      };
    }
  }

  async getTrialStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const trialEndDate = userData.trialEndDate ? new Date(userData.trialEndDate) : null;
      const now = new Date();
      
      if (!trialEndDate) {
        return {
          isActive: false,
          daysRemaining: 0,
          usedLeads: 0,
          totalLeads: 0,
          usedEmails: 0,
          totalEmails: 0,
          leadsProgress: 0,
          emailsProgress: 0
        };
      }

      const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const usedLeads = userData.usedLeads || 0;
      const totalLeads = userData.totalLeads || 100;
      const usedEmails = userData.usedEmails || 0;
      const totalEmails = userData.totalEmails || 500;
      
      return {
        isActive: daysRemaining > 0 && userData.subscriptionStatus === 'trial',
        daysRemaining,
        usedLeads,
        totalLeads,
        usedEmails,
        totalEmails,
        leadsProgress: Math.min(100, Math.round((usedLeads / totalLeads) * 100)),
        emailsProgress: Math.min(100, Math.round((usedEmails / totalEmails) * 100))
      };
    } catch (error) {
      console.error('Error fetching trial status:', error);
      throw error;
    }
  }

  async getTopPerformingCampaigns(userId: string) {
    try {
      const q = query(
        this.campaignsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        fsOrderBy('openRate', 'desc'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          openRate: (data.openCount / data.sentCount) * 100 || 0,
          clickRate: (data.clickCount / data.sentCount) * 100 || 0,
          conversionRate: (data.clickCount / data.openCount) * 100 || 0,
        };
      });
    } catch (error) {
      console.error('Error getting top performing campaigns:', error);
      return [];
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

  async startFreeTrial(userId: string): Promise<void> {
    try {
      const docRef = doc(this.usersRef, userId);
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial

      await updateDoc(docRef, {
        trialEndDate: trialEndDate.toISOString(),
        subscriptionStatus: 'trial',
        usedLeads: 0,
        totalLeads: 100,
        usedEmails: 0,
        totalEmails: 500,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Start free trial error:', error);
      throw new Error('Failed to start free trial');
    }
  }

  subscribeToUserUpdates(userId: string, callback: (userData: any) => void) {
    try {
      const docRef = doc(this.usersRef, userId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          callback({
            id: docSnap.id,
            ...docSnap.data()
          });
        }
      }, (error) => {
        console.error('Error in user subscription:', error);
      });
    } catch (error) {
      console.error('Subscribe to user updates error:', error);
      // Return a no-op function as fallback
      return () => {};
    }
  }

  async getUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  async initializeUserData(userId: string, initialData: any) {
    try {
      // Check if user document already exists
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        // Create new user document with initial data
        await setDoc(doc(db, 'users', userId), {
          ...initialData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // If document exists but needs subscription data
        if (!userDoc.data().subscriptionData) {
          await updateDoc(doc(db, 'users', userId), {
            subscriptionData: initialData.subscriptionData,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error;
    }
  }

  async getBasicAnalytics(userId: string) {
    try {
      // Get all campaigns for the user
      const campaigns = await this.getUserCampaigns(userId);
      
      // Calculate basic analytics
      const totalCampaigns = campaigns.length;
      let totalEmails = 0;
      let totalOpens = 0;
      let totalClicks = 0;

      campaigns.forEach(campaign => {
        totalEmails += campaign.sentCount || 0;
        totalOpens += campaign.openCount || 0;
        totalClicks += campaign.clickCount || 0;
      });

      // Calculate rates
      const averageOpenRate = totalEmails > 0 ? (totalOpens / totalEmails) * 100 : 0;
      const averageClickRate = totalEmails > 0 ? (totalClicks / totalEmails) * 100 : 0;

      return {
        totalCampaigns,
        totalEmails,
        averageOpenRate,
        averageClickRate
      };
    } catch (error) {
      console.error('Error getting basic analytics:', error);
      throw new Error('Failed to get basic analytics');
    }
  }

  async getUserStats(): Promise<{ emailsSent: number; smsSent: number }> {
    try {
      const statsRef = collection(db, 'user_stats');
      const q = query(statsRef, where('userId', '==', auth.currentUser?.uid), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { emailsSent: 0, smsSent: 0 };
      }

      const stats = querySnapshot.docs[0].data();
      return {
        emailsSent: stats.emailsSent || 0,
        smsSent: stats.smsSent || 0,
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { emailsSent: 0, smsSent: 0 };
    }
  }

  // Get user statistics
  async getUserStats(userId: string = 'user123') {
    try {
      return {
        emailsSent: 5678,
        emailsOpened: 3245,
        emailsClicked: 1876,
        emailsSentToday: 245,
        emailsOpenedToday: 112,
        smsSent: 1245,
        smsDelivered: 1198,
        smsSentToday: 45,
        leadsTotal: 12567,
        leadsActiveTotal: 8934,
        leadsAddedToday: 124,
        conversionRate: 4.2,
        averageOpenRate: 57.2,
        averageClickRate: 33.1
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
  
  // Get user document
  async getUserDocument(userId: string) {
    try {
      // In a real implementation, this would query Firestore
      // For now, we'll return mock data
      return {
        id: userId,
        email: 'user@example.com',
        displayName: 'Demo User',
        subscription: {
          userId,
          tier: 'pro',
          limits: 10000,
          maxEmails: 10000,
          maxContacts: 5000,
          maxSMS: 1000,
          features: {
            followUpEmails: true,
            abTesting: true,
            aiOptimization: true,
            analytics: true,
            customDomain: true,
            previewLeads: true,
            importContacts: true,
            fullLeadAccess: true,
            bulkOperations: true,
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usageStats: {
            usedEmails: 2345,
            usedSMS: 456,
            usedLeads: 3456,
          },
        },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting user document:', error);
      throw error;
    }
  }
  
  // Create user document
  async createUserDocument(userId: string, data: any) {
    try {
      console.log(`Creating user document for ${userId} with data:`, data);
      // In a real implementation, this would create a document in Firestore
      return { id: userId };
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }
}

export const firestoreService = new FirestoreService();
export type { Campaign, Transaction }; 