import { analyticsService } from '@/services/analytics';
import { firestoreService } from '@/services/firestore';
import { mockFirestore } from '@/utils/test-utils';

// Mock Firestore service
jest.mock('@/services/firestore');

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCampaignMetrics', () => {
    it('should return campaign metrics', async () => {
      const mockCampaign = {
        id: 'test-campaign',
        totalEmails: 100,
        sentCount: 80,
        openCount: 40,
        clickCount: 20,
        bounceCount: 5,
      };

      (firestoreService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);

      const metrics = await analyticsService.getCampaignMetrics('test-campaign');

      expect(metrics).toEqual({
        totalEmails: 100,
        sentEmails: 80,
        openRate: 50, // 40/80 * 100
        clickRate: 25, // 20/80 * 100
        bounceRate: 6.25, // 5/80 * 100
      });
    });

    it('should handle campaign not found', async () => {
      (firestoreService.getCampaign as jest.Mock).mockResolvedValue(null);

      await expect(analyticsService.getCampaignMetrics('non-existent'))
        .rejects
        .toThrow('Campaign not found');
    });
  });

  describe('getUserCampaignStats', () => {
    it('should return user campaign statistics', async () => {
      const mockCampaigns = [
        {
          status: 'active',
          sentCount: 100,
          openCount: 50,
          clickCount: 25,
        },
        {
          status: 'completed',
          sentCount: 200,
          openCount: 100,
          clickCount: 50,
        },
      ];

      (firestoreService.getUserCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

      const stats = await analyticsService.getUserCampaignStats('test-user');

      expect(stats).toEqual({
        totalCampaigns: 2,
        activeCount: 1,
        completedCount: 1,
        avgOpenRate: 50, // (150/300) * 100
        avgClickRate: 25, // (75/300) * 100
      });
    });
  });

  describe('getNichePerformance', () => {
    it('should return niche performance metrics', async () => {
      const mockCampaigns = [
        {
          niche: 'Fashion',
          sentCount: 100,
          openCount: 50,
          clickCount: 25,
          totalEmails: 100,
        },
        {
          niche: 'Fashion',
          sentCount: 100,
          openCount: 40,
          clickCount: 20,
          totalEmails: 100,
        },
      ];

      (firestoreService.getUserCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

      const performance = await analyticsService.getNichePerformance('test-user');

      expect(performance).toEqual([
        {
          niche: 'Fashion',
          campaigns: 2,
          avgOpenRate: 45, // (90/200) * 100
          avgClickRate: 22.5, // (45/200) * 100
          totalEmails: 200,
        },
      ]);
    });
  });

  describe('getTimeSeriesData', () => {
    it('should return time series data for campaigns', async () => {
      const mockCampaigns = [
        {
          createdAt: new Date('2024-01-01'),
          sentCount: 100,
          openCount: 50,
          clickCount: 25,
        },
        {
          createdAt: new Date('2024-01-01'),
          sentCount: 100,
          openCount: 40,
          clickCount: 20,
        },
      ];

      (firestoreService.getUserCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

      const timeSeriesData = await analyticsService.getTimeSeriesData('test-user', 7);

      expect(timeSeriesData).toHaveLength(7);
      expect(timeSeriesData[6]).toEqual({
        date: '2024-01-01',
        sent: 200,
        opens: 90,
        clicks: 45,
      });
    });
  });

  describe('getROIMetrics', () => {
    it('should calculate ROI metrics correctly', async () => {
      const mockTransactions = [
        { amount: 100 },
        { amount: 200 },
      ];

      const mockCampaigns = [
        {
          sentCount: 1000,
          openCount: 500,
          clickCount: 250,
        },
        {
          sentCount: 2000,
          openCount: 1000,
          clickCount: 500,
        },
      ];

      (firestoreService.getUserTransactions as jest.Mock).mockResolvedValue(mockTransactions);
      (firestoreService.getUserCampaigns as jest.Mock).mockResolvedValue(mockCampaigns);

      const metrics = await analyticsService.getROIMetrics('test-user');

      expect(metrics).toEqual({
        totalSpent: 300,
        emailsSent: 3000,
        costPerEmail: 0.1, // 300/3000
        engagementRate: 37.5, // ((1500 + 750) / (3000 * 2)) * 100
      });
    });
  });
}); 