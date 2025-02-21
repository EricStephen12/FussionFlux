import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import type { Campaign } from './firestore';

interface CampaignMetrics {
  totalEmails: number;
  sentEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface NichePerformance {
  niche: string;
  campaigns: number;
  avgOpenRate: number;
  avgClickRate: number;
  totalEmails: number;
}

interface TimeSeriesData {
  date: string;
  sent: number;
  opens: number;
  clicks: number;
}

export class AnalyticsService {
  private campaignsRef = collection(db, 'campaigns');
  private usersRef = collection(db, 'users');
  private analyticsRef = collection(db, 'analytics');

  async getDashboardStats(userId: string) {
    try {
      // Get campaign stats
      const campaignQuery = query(
        this.campaignsRef,
        where('userId', '==', userId)
      );
      const campaigns = await getDocs(campaignQuery);
      
      const stats = {
        totalCampaigns: campaigns.size,
        activeCampaigns: 0,
        totalEmails: 0,
        openRate: 0,
        clickRate: 0,
        revenue: 0,
        revenueGrowth: 0,
      };

      let totalOpens = 0;
      let totalClicks = 0;
      let totalSent = 0;

      campaigns.forEach(doc => {
        const campaign = doc.data();
        if (campaign.status === 'active') stats.activeCampaigns++;
        if (campaign.sentCount) totalSent += campaign.sentCount;
        if (campaign.openCount) totalOpens += campaign.openCount;
        if (campaign.clickCount) totalClicks += campaign.clickCount;
      });

      stats.totalEmails = totalSent;
      stats.openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      stats.clickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  async getPerformanceData(userId: string, period: 'day' | 'week' | 'month') {
    try {
      const analyticsQuery = query(
        this.analyticsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(period === 'day' ? 24 : period === 'week' ? 7 : 30)
      );

      const snapshot = await getDocs(analyticsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error) {
      console.error('Error getting performance data:', error);
      throw error;
    }
  }

  async trackEvent(userId: string, eventType: string, eventData: any) {
    try {
      const analyticsDoc = {
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      };

      await this.analyticsRef.add(analyticsDoc);
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaignDoc = await getDocs(query(this.campaignsRef, where('id', '==', campaignId)));
    
    if (campaignDoc.empty) {
      throw new Error('Campaign not found');
    }

    const campaign = campaignDoc.docs[0].data() as Campaign;
    const sentEmails = campaign.sentCount || 0;
    const openCount = campaign.openCount || 0;
    const clickCount = campaign.clickCount || 0;
    const bounceCount = campaign.bounceCount || 0;

    return {
      totalEmails: campaign.totalEmails,
      sentEmails,
      openRate: sentEmails > 0 ? (openCount / sentEmails) * 100 : 0,
      clickRate: sentEmails > 0 ? (clickCount / sentEmails) * 100 : 0,
      bounceRate: sentEmails > 0 ? (bounceCount / sentEmails) * 100 : 0,
    };
  }

  async getUserCampaignStats(userId: string): Promise<{
    totalCampaigns: number;
    activeCount: number;
    completedCount: number;
    avgOpenRate: number;
    avgClickRate: number;
  }> {
    const userCampaigns = await getDocs(
      query(this.campaignsRef, where('userId', '==', userId))
    );

    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    let activeCount = 0;
    let completedCount = 0;

    userCampaigns.forEach((doc) => {
      const campaign = doc.data() as Campaign;
      totalOpens += campaign.openCount || 0;
      totalClicks += campaign.clickCount || 0;
      totalSent += campaign.sentCount || 0;

      if (campaign.status === 'active') activeCount++;
      if (campaign.status === 'completed') completedCount++;
    });

    return {
      totalCampaigns: userCampaigns.size,
      activeCount,
      completedCount,
      avgOpenRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
    };
  }

  async getNichePerformance(userId: string): Promise<NichePerformance[]> {
    const userCampaigns = await getDocs(
      query(this.campaignsRef, where('userId', '==', userId))
    );

    const nicheStats: Record<string, {
      campaigns: number;
      totalOpens: number;
      totalClicks: number;
      totalSent: number;
      totalEmails: number;
    }> = {};

    userCampaigns.forEach((doc) => {
      const campaign = doc.data() as Campaign;
      const niche = campaign.niche;

      if (!nicheStats[niche]) {
        nicheStats[niche] = {
          campaigns: 0,
          totalOpens: 0,
          totalClicks: 0,
          totalSent: 0,
          totalEmails: 0,
        };
      }

      nicheStats[niche].campaigns++;
      nicheStats[niche].totalOpens += campaign.openCount || 0;
      nicheStats[niche].totalClicks += campaign.clickCount || 0;
      nicheStats[niche].totalSent += campaign.sentCount || 0;
      nicheStats[niche].totalEmails += campaign.totalEmails;
    });

    return Object.entries(nicheStats).map(([niche, stats]) => ({
      niche,
      campaigns: stats.campaigns,
      avgOpenRate: stats.totalSent > 0 ? (stats.totalOpens / stats.totalSent) * 100 : 0,
      avgClickRate: stats.totalSent > 0 ? (stats.totalClicks / stats.totalSent) * 100 : 0,
      totalEmails: stats.totalEmails,
    }));
  }

  async getTimeSeriesData(
    userId: string,
    days: number = 30
  ): Promise<TimeSeriesData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userCampaigns = await getDocs(
      query(
        this.campaignsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'asc')
      )
    );

    const dailyStats: Record<string, TimeSeriesData> = {};
    
    // Initialize daily stats for the past 'days' days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = {
        date: dateStr,
        sent: 0,
        opens: 0,
        clicks: 0,
      };
    }

    userCampaigns.forEach((doc) => {
      const campaign = doc.data() as Campaign;
      const date = new Date(campaign.createdAt).toISOString().split('T')[0];

      if (dailyStats[date]) {
        dailyStats[date].sent += campaign.sentCount || 0;
        dailyStats[date].opens += campaign.openCount || 0;
        dailyStats[date].clicks += campaign.clickCount || 0;
      }
    });

    return Object.values(dailyStats).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getROIMetrics(userId: string): Promise<{
    totalSpent: number;
    emailsSent: number;
    costPerEmail: number;
    engagementRate: number;
  }> {
    // Get all user transactions
    const transactionsRef = collection(db, 'transactions');
    const userTransactions = await getDocs(
      query(transactionsRef, where('userId', '==', userId))
    );

    let totalSpent = 0;
    userTransactions.forEach((doc) => {
      const transaction = doc.data();
      totalSpent += transaction.amount || 0;
    });

    // Get campaign stats
    const stats = await this.getUserCampaignStats(userId);
    const userCampaigns = await getDocs(
      query(this.campaignsRef, where('userId', '==', userId))
    );

    let totalEmailsSent = 0;
    let totalEngagements = 0;

    userCampaigns.forEach((doc) => {
      const campaign = doc.data() as Campaign;
      totalEmailsSent += campaign.sentCount || 0;
      totalEngagements += (campaign.openCount || 0) + (campaign.clickCount || 0);
    });

    return {
      totalSpent,
      emailsSent: totalEmailsSent,
      costPerEmail: totalEmailsSent > 0 ? totalSpent / totalEmailsSent : 0,
      engagementRate: totalEmailsSent > 0 ? (totalEngagements / (totalEmailsSent * 2)) * 100 : 0,
    };
  }
}

export const analyticsService = new AnalyticsService();
export type { CampaignMetrics, NichePerformance, TimeSeriesData }; 