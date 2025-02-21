import { firestoreService } from './firestore';
import type { EmailTemplate } from './sendgrid';

interface ABTestVariant {
  templateId: string;
  name: string;
  weight: number; // Percentage of users who should see this variant (0-100)
  stats: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
  };
}

interface ABTest {
  id: string;
  campaignId: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused';
  winningVariant?: string;
}

class ABTestingService {
  async createTest(campaignId: string, variants: Omit<ABTestVariant, 'stats'>[]): Promise<string> {
    try {
      // Validate total weight is 100%
      const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
      if (totalWeight !== 100) {
        throw new Error('Total variant weights must equal 100%');
      }

      const test: ABTest = {
        campaignId,
        variants: variants.map(v => ({
          ...v,
          stats: { sent: 0, opens: 0, clicks: 0, conversions: 0 },
        })),
        startDate: new Date(),
        status: 'active',
      };

      const testRef = await firestoreService.addDocument('ab_tests', test);
      return testRef.id;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw new Error('Failed to create A/B test');
    }
  }

  async getTestVariant(testId: string): Promise<string> {
    try {
      const test = await firestoreService.getDocument('ab_tests', testId);
      if (!test || test.status !== 'active') {
        throw new Error('Test not found or not active');
      }

      // Random number between 0-100
      const random = Math.random() * 100;
      let weightSum = 0;

      // Select variant based on weight distribution
      for (const variant of test.variants) {
        weightSum += variant.weight;
        if (random <= weightSum) {
          return variant.templateId;
        }
      }

      // Fallback to first variant
      return test.variants[0].templateId;
    } catch (error) {
      console.error('Error getting test variant:', error);
      throw error;
    }
  }

  async trackEvent(testId: string, templateId: string, event: 'sent' | 'open' | 'click' | 'conversion') {
    try {
      const test = await firestoreService.getDocument('ab_tests', testId);
      if (!test) return;

      const variant = test.variants.find(v => v.templateId === templateId);
      if (!variant) return;

      // Update variant stats
      variant.stats[event === 'sent' ? 'sent' : 
                   event === 'open' ? 'opens' :
                   event === 'click' ? 'clicks' : 'conversions']++;

      await firestoreService.updateDocument('ab_tests', testId, { variants: test.variants });

      // Check if we should determine a winner
      if (this.shouldDetermineWinner(test)) {
        await this.determineWinner(testId);
      }
    } catch (error) {
      console.error('Error tracking A/B test event:', error);
    }
  }

  private shouldDetermineWinner(test: ABTest): boolean {
    // Example criteria: At least 1000 total sends and 7 days passed
    const totalSent = test.variants.reduce((sum, v) => sum + v.stats.sent, 0);
    const daysSinceStart = (new Date().getTime() - test.startDate.getTime()) / (1000 * 60 * 60 * 24);

    return totalSent >= 1000 && daysSinceStart >= 7;
  }

  private async determineWinner(testId: string) {
    try {
      const test = await firestoreService.getDocument('ab_tests', testId);
      if (!test || test.status !== 'active') return;

      // Calculate conversion rates
      const variants = test.variants.map(variant => ({
        ...variant,
        conversionRate: (variant.stats.conversions / variant.stats.sent) * 100,
      }));

      // Find variant with highest conversion rate
      const winner = variants.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );

      // Update test
      await firestoreService.updateDocument('ab_tests', testId, {
        status: 'completed',
        endDate: new Date(),
        winningVariant: winner.templateId,
      });
    } catch (error) {
      console.error('Error determining A/B test winner:', error);
    }
  }

  async getTestResults(testId: string): Promise<{
    variants: Array<ABTestVariant & { conversionRate: number }>;
    winner?: string;
    status: ABTest['status'];
  }> {
    try {
      const test = await firestoreService.getDocument('ab_tests', testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const variants = test.variants.map(variant => ({
        ...variant,
        conversionRate: variant.stats.sent > 0 
          ? (variant.stats.conversions / variant.stats.sent) * 100
          : 0,
      }));

      return {
        variants,
        winner: test.winningVariant,
        status: test.status,
      };
    } catch (error) {
      console.error('Error getting test results:', error);
      throw error;
    }
  }
}

export const abTestingService = new ABTestingService();
export type { ABTest, ABTestVariant }; 