import { db } from '@/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  deleteDoc, 
  Timestamp,
  increment,
  serverTimestamp
} from 'firebase/firestore';

export interface Subscriber {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  source: 'campaign' | 'landing_page' | 'form' | 'manual' | 'import';
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  campaigns: string[];
  subscribedAt: Date | Timestamp;
  unsubscribedAt?: Date | Timestamp;
  userId: string; // The Fussion Flux user who owns this subscriber
  tags?: string[];
  customFields?: Record<string, any>;
  engagementScore?: number;
  lastEngagement?: Date | Timestamp;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  country?: string;
  consent?: {
    timestamp: Date | Timestamp;
    method: string;
    ip?: string;
  };
}

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  growth: number;
  campaigns: {
    id: string;
    name: string;
    subscribers: number;
    unsubscribes: number;
  }[];
}

interface SubscriberEvent {
  id?: string;
  subscriberId: string;
  type: 'subscribe' | 'unsubscribe' | 'open' | 'click' | 'bounce' | 'complaint';
  campaignId?: string;
  timestamp: Date | Timestamp;
  metadata?: Record<string, any>;
}

class SubscriberService {
  private subscribersRef = collection(db, 'subscribers');
  private subscriberEventsRef = collection(db, 'subscriberEvents');
  private userStatsRef = collection(db, 'userStats');
  
  /**
   * Add a new subscriber to the system
   */
  async addSubscriber(subscriber: Omit<Subscriber, 'id' | 'subscribedAt'>): Promise<Subscriber> {
    try {
      // Check if subscriber already exists for this user
      const existingQuery = query(
        this.subscribersRef,
        where('email', '==', subscriber.email),
        where('userId', '==', subscriber.userId)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        const existingId = existingSnapshot.docs[0].id;
        const existingData = existingSnapshot.docs[0].data() as Subscriber;
        
        // If subscriber exists but unsubscribed, reactivate them
        if (existingData.status === 'unsubscribed') {
          await updateDoc(doc(this.subscribersRef, existingId), {
            status: 'active',
            subscribedAt: serverTimestamp(),
            campaigns: [...(existingData.campaigns || []), ...(subscriber.campaigns || [])],
            source: subscriber.source,
            // Keep other fields unchanged
          });
          
          // Log the resubscribe event
          await this.logSubscriberEvent({
            subscriberId: existingId,
            type: 'subscribe',
            campaignId: subscriber.campaigns?.[0],
            timestamp: new Date(),
            metadata: { resubscribed: true }
          });
          
          // Update user stats
          await this.updateUserStats(subscriber.userId, 'resubscribe');
          
          return {
            ...existingData,
            id: existingId,
            status: 'active',
            subscribedAt: new Date(),
            campaigns: [...(existingData.campaigns || []), ...(subscriber.campaigns || [])]
          };
        }
        
        // If active, just update campaigns if needed
        if (subscriber.campaigns?.length) {
          // Add any new campaigns to the existing campaigns array
          const updatedCampaigns = [
            ...new Set([...(existingData.campaigns || []), ...subscriber.campaigns])
          ];
          
          await updateDoc(doc(this.subscribersRef, existingId), {
            campaigns: updatedCampaigns,
          });
        }
        
        return { ...existingData, id: existingId };
      }
      
      // Create new subscriber
      const newSubscriberRef = doc(this.subscribersRef);
      const newSubscriber = {
        ...subscriber,
        subscribedAt: serverTimestamp(),
        status: 'active',
        campaigns: subscriber.campaigns || [],
      };
      
      await setDoc(newSubscriberRef, newSubscriber);
      
      // Log the subscribe event
      await this.logSubscriberEvent({
        subscriberId: newSubscriberRef.id,
        type: 'subscribe',
        campaignId: subscriber.campaigns?.[0],
        timestamp: new Date(),
      });
      
      // Update user stats
      await this.updateUserStats(subscriber.userId, 'subscribe');
      
      return {
        ...newSubscriber,
        id: newSubscriberRef.id,
        subscribedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }
  
  /**
   * Process an unsubscribe request from a subscriber
   */
  async unsubscribe(
    email: string, 
    userId: string, 
    campaignId?: string, 
    reason?: string
  ): Promise<boolean> {
    try {
      const subscriberQuery = query(
        this.subscribersRef,
        where('email', '==', email),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(subscriberQuery);
      
      if (snapshot.empty) {
        return false;
      }
      
      const subscriberId = snapshot.docs[0].id;
      await updateDoc(doc(this.subscribersRef, subscriberId), {
        status: 'unsubscribed',
        unsubscribedAt: serverTimestamp()
      });
      
      // Log the unsubscribe event
      await this.logSubscriberEvent({
        subscriberId,
        type: 'unsubscribe',
        campaignId,
        timestamp: new Date(),
        metadata: { reason }
      });
      
      // Update user stats
      await this.updateUserStats(userId, 'unsubscribe');
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }
  
  /**
   * Get subscriber statistics for a user
   */
  async getSubscriberStats(userId: string): Promise<SubscriberStats> {
    try {
      // Get user stats document
      const userStatsDoc = doc(this.userStatsRef, userId);
      const userStatsSnapshot = await getDoc(userStatsDoc);
      
      if (userStatsSnapshot.exists()) {
        const stats = userStatsSnapshot.data();
        
        // Fetch campaign-specific subscriber stats
        const campaignStatsQuery = query(
          collection(db, 'campaignStats'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const campaignStatsSnapshot = await getDocs(campaignStatsQuery);
        const campaignStats = campaignStatsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return {
          total: stats.totalSubscribers || 0,
          active: stats.activeSubscribers || 0,
          unsubscribed: stats.unsubscribedSubscribers || 0,
          bounced: stats.bouncedSubscribers || 0,
          complained: stats.complainedSubscribers || 0,
          growth: stats.subscriberGrowth || 0,
          campaigns: campaignStats.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            subscribers: campaign.subscribers || 0,
            unsubscribes: campaign.unsubscribes || 0
          }))
        };
      }
      
      // If no stats document exists, create one with zeros
      await setDoc(userStatsDoc, {
        totalSubscribers: 0,
        activeSubscribers: 0,
        unsubscribedSubscribers: 0,
        bouncedSubscribers: 0,
        complainedSubscribers: 0,
        subscriberGrowth: 0,
        updatedAt: serverTimestamp()
      });
      
      return {
        total: 0,
        active: 0,
        unsubscribed: 0,
        bounced: 0,
        complained: 0,
        growth: 0,
        campaigns: []
      };
    } catch (error) {
      console.error('Error getting subscriber stats:', error);
      throw error;
    }
  }
  
  /**
   * Get all subscribers for a user with optional filtering
   */
  async getSubscribers(
    userId: string, 
    status: 'all' | 'active' | 'unsubscribed' | 'bounced' | 'complained' = 'all',
    page: number = 1,
    pageSize: number = 50,
    searchTerm: string = '',
    sortBy: string = 'subscribedAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{ subscribers: Subscriber[], total: number }> {
    try {
      let subscriberQuery: any = query(
        this.subscribersRef,
        where('userId', '==', userId)
      );
      
      // Apply status filter
      if (status !== 'all') {
        subscriberQuery = query(subscriberQuery, where('status', '==', status));
      }
      
      // Apply sorting
      subscriberQuery = query(subscriberQuery, orderBy(sortBy, sortDirection));
      
      // Apply pagination
      subscriberQuery = query(subscriberQuery, limit(pageSize));
      
      const snapshot = await getDocs(subscriberQuery);
      const subscribers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subscriber[];
      
      // If search term is provided, filter results
      let filteredSubscribers = subscribers;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredSubscribers = subscribers.filter(sub => 
          sub.email.toLowerCase().includes(lowerSearchTerm) ||
          sub.firstName?.toLowerCase().includes(lowerSearchTerm) ||
          sub.lastName?.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // Get total count for this user
      const countQuery = query(
        this.subscribersRef,
        where('userId', '==', userId),
        status !== 'all' ? where('status', '==', status) : where('userId', '==', userId)
      );
      
      const countSnapshot = await getDocs(countQuery);
      const total = countSnapshot.size;
      
      return {
        subscribers: filteredSubscribers,
        total
      };
    } catch (error) {
      console.error('Error getting subscribers:', error);
      throw error;
    }
  }
  
  /**
   * Update a specific subscriber
   */
  async updateSubscriber(
    subscriberId: string, 
    updates: Partial<Subscriber>
  ): Promise<Subscriber> {
    try {
      const subscriberRef = doc(this.subscribersRef, subscriberId);
      await updateDoc(subscriberRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      const updated = await getDoc(subscriberRef);
      return { id: subscriberId, ...updated.data() } as Subscriber;
    } catch (error) {
      console.error('Error updating subscriber:', error);
      throw error;
    }
  }
  
  /**
   * Log a subscriber event (subscribe, unsubscribe, open, click, etc.)
   */
  private async logSubscriberEvent(event: SubscriberEvent): Promise<void> {
    try {
      const eventRef = doc(this.subscriberEventsRef);
      await setDoc(eventRef, {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging subscriber event:', error);
      throw error;
    }
  }
  
  /**
   * Update user statistics when subscriber counts change
   */
  private async updateUserStats(
    userId: string, 
    eventType: 'subscribe' | 'unsubscribe' | 'resubscribe' | 'bounce' | 'complaint'
  ): Promise<void> {
    try {
      const userStatsRef = doc(this.userStatsRef, userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (!userStatsDoc.exists()) {
        // Create new stats document if it doesn't exist
        await setDoc(userStatsRef, {
          totalSubscribers: eventType === 'subscribe' ? 1 : 0,
          activeSubscribers: eventType === 'subscribe' ? 1 : 0,
          unsubscribedSubscribers: eventType === 'unsubscribe' ? 1 : 0,
          bouncedSubscribers: eventType === 'bounce' ? 1 : 0,
          complainedSubscribers: eventType === 'complaint' ? 1 : 0,
          subscriberGrowth: eventType === 'subscribe' ? 1 : 0,
          updatedAt: serverTimestamp()
        });
        return;
      }
      
      // Update existing stats
      const updates: Record<string, any> = {
        updatedAt: serverTimestamp()
      };
      
      switch(eventType) {
        case 'subscribe':
          updates.totalSubscribers = increment(1);
          updates.activeSubscribers = increment(1);
          updates.subscriberGrowth = increment(1);
          break;
        case 'unsubscribe':
          updates.activeSubscribers = increment(-1);
          updates.unsubscribedSubscribers = increment(1);
          updates.subscriberGrowth = increment(-1);
          break;
        case 'resubscribe':
          updates.activeSubscribers = increment(1);
          updates.unsubscribedSubscribers = increment(-1);
          updates.subscriberGrowth = increment(1);
          break;
        case 'bounce':
          updates.activeSubscribers = increment(-1);
          updates.bouncedSubscribers = increment(1);
          updates.subscriberGrowth = increment(-1);
          break;
        case 'complaint':
          updates.activeSubscribers = increment(-1);
          updates.complainedSubscribers = increment(1);
          updates.subscriberGrowth = increment(-1);
          break;
      }
      
      await updateDoc(userStatsRef, updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
  
  /**
   * Generate an unsubscribe URL with a secure token
   */
  generateUnsubscribeUrl(
    email: string,
    userId: string,
    campaignId?: string
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fussionflux.com';
    
    // Create a simple hash for security
    const emailHash = Buffer.from(email).toString('base64');
    const timestamp = Date.now();
    const token = Buffer.from(`${email}:${userId}:${timestamp}`).toString('base64');
    
    return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&t=${token}&c=${campaignId || ''}`;
  }
  
  /**
   * Validate an unsubscribe token
   */
  validateUnsubscribeToken(email: string, token: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [tokenEmail, userId, timestamp] = decoded.split(':');
      
      // Check if email matches
      if (tokenEmail !== email) {
        return false;
      }
      
      // Check if token is expired (token valid for 30 days)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      
      if (now - tokenTime > thirtyDaysMs) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Track campaign revenue by subscriber
   */
  async trackRevenue(
    subscriberId: string,
    campaignId: string,
    amount: number,
    orderId: string,
    currency: string = 'USD'
  ): Promise<void> {
    try {
      // Get the subscriber to find the user ID
      const subscriberRef = doc(this.subscribersRef, subscriberId);
      const subscriberDoc = await getDoc(subscriberRef);
      
      if (!subscriberDoc.exists()) {
        throw new Error('Subscriber not found');
      }
      
      const subscriber = subscriberDoc.data() as Subscriber;
      
      // Log the revenue event
      const revenueRef = doc(collection(db, 'revenue'));
      await setDoc(revenueRef, {
        subscriberId,
        campaignId,
        amount,
        orderId,
        currency,
        userId: subscriber.userId,
        timestamp: serverTimestamp()
      });
      
      // Update campaign revenue stats
      const campaignStatsRef = doc(collection(db, 'campaignStats'), campaignId);
      await updateDoc(campaignStatsRef, {
        revenue: increment(amount),
        conversions: increment(1)
      });
      
      // Update user revenue stats
      const userStatsRef = doc(this.userStatsRef, subscriber.userId);
      await updateDoc(userStatsRef, {
        totalRevenue: increment(amount),
        conversions: increment(1)
      });
    } catch (error) {
      console.error('Error tracking revenue:', error);
      throw error;
    }
  }
  
  /**
   * Get revenue statistics for a user
   */
  async getRevenueStats(
    userId: string
  ): Promise<{
    total: number;
    lastThirtyDays: number;
    byCampaign: Array<{
      campaignId: string;
      campaignName: string;
      revenue: number;
      conversions: number;
    }>;
  }> {
    try {
      // Get total revenue
      const userStatsRef = doc(this.userStatsRef, userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      const totalRevenue = userStatsDoc.exists() 
        ? userStatsDoc.data().totalRevenue || 0
        : 0;
      
      // Get revenue for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRevenueQuery = query(
        collection(db, 'revenue'),
        where('userId', '==', userId),
        where('timestamp', '>=', thirtyDaysAgo)
      );
      
      const recentRevenueSnapshot = await getDocs(recentRevenueQuery);
      let lastThirtyDaysRevenue = 0;
      
      recentRevenueSnapshot.forEach(doc => {
        lastThirtyDaysRevenue += doc.data().amount || 0;
      });
      
      // Get revenue by campaign
      const campaignStatsQuery = query(
        collection(db, 'campaignStats'),
        where('userId', '==', userId),
        orderBy('revenue', 'desc'),
        limit(10)
      );
      
      const campaignStatsSnapshot = await getDocs(campaignStatsQuery);
      const campaignStats = campaignStatsSnapshot.docs.map(doc => ({
        campaignId: doc.id,
        campaignName: doc.data().name || 'Unknown Campaign',
        revenue: doc.data().revenue || 0,
        conversions: doc.data().conversions || 0
      }));
      
      return {
        total: totalRevenue,
        lastThirtyDays: lastThirtyDaysRevenue,
        byCampaign: campaignStats
      };
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      throw error;
    }
  }
  
  /**
   * Delete a subscriber by ID
   * @param subscriberId The ID of the subscriber to delete
   * @returns A promise that resolves when the subscriber is deleted
   */
  async deleteSubscriber(subscriberId: string): Promise<void> {
    try {
      // Get the subscriber document to preserve info for stats update
      const subscriberDoc = await getDoc(doc(this.subscribersRef, subscriberId));
      if (!subscriberDoc.exists()) {
        throw new Error('Subscriber not found');
      }
      
      const subscriberData = subscriberDoc.data() as Subscriber;
      
      // Delete the subscriber
      await deleteDoc(doc(this.subscribersRef, subscriberId));
      
      // Update user stats based on previous status
      if (subscriberData.status === 'active') {
        await this.updateUserStats(subscriberData.userId, 'unsubscribe');
      } else if (subscriberData.status === 'unsubscribed') {
        // No change in active count, but reduce total count
        const userStatsRef = doc(this.userStatsRef, subscriberData.userId);
        await updateDoc(userStatsRef, {
          'total': increment(-1)
        });
      }
      
      console.log(`Subscriber ${subscriberId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      throw error;
    }
  }
}

export const subscriberService = new SubscriberService(); 