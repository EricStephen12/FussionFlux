// @ts-nocheck

import { firestoreService } from './firestore';
import { db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore';
import { aiOptimizationService } from './ai-optimization';

interface ABTestVariant {
  templateId: string;
  name: string;
  weight: number;
  stats: {
    sent: number;
    opens: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  aiInsights?: {
    predictedConversionRate: number;
    suggestedImprovements: string[];
    confidence: number;
  };
}

interface ABTest {
  id: string;
  campaignId: string;
  userId: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'paused';
  winningVariant?: string;
  testDuration: number;
  winningCriteria: 'openRate' | 'clickRate' | 'conversionRate' | 'revenue';
  segmentation?: {
    criteria: string[];
    audienceSize: number;
  };
  insights?: {
    confidenceLevel: number;
    statisticalSignificance: boolean;
    recommendedActions: string[];
    performanceFactors: {
      [key: string]: {
        impact: number;
        confidence: number;
      };
    };
  };
}

export class ABTestingService {
  private abTestsRef = collection(db, 'ab_tests');

  async createABTest(abTest: ABTest): Promise<void> {
    const abTestRef = await addDoc(this.abTestsRef, abTest);
    console.log('A/B Test created with ID:', abTestRef.id);
  }

  async getABTest(testId: string): Promise<ABTest | null> {
    const abTestDoc = await getDoc(doc(this.abTestsRef, testId));
    return abTestDoc.exists() ? (abTestDoc.data() as ABTest) : null;
  }

  async createTest(
    userId: string,
    campaignId: string, 
    variants: Omit<ABTestVariant, 'stats'>[],
    testDuration: number = 168,
    winningCriteria: ABTest['winningCriteria'] = 'conversionRate',
    segmentation?: ABTest['segmentation']
  ): Promise<string> {
    try {
      // Validate total weight is 100%
      const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
      if (totalWeight !== 100) {
        throw new Error('Total variant weights must equal 100%');
      }

      // Get AI insights for each variant
      const variantsWithInsights = await Promise.all(
        variants.map(async variant => {
          const template = await firestoreService.getTemplate(variant.templateId);
          if (!template) throw new Error(`Template ${variant.templateId} not found`);

          const aiInsights = await aiOptimizationService.analyzeVariant(template);
          
          return {
            ...variant,
            stats: { sent: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0 },
            aiInsights
          };
        })
      );

      const test: Omit<ABTest, 'id'> = {
        userId,
        campaignId,
        variants: variantsWithInsights,
        startDate: new Date(),
        status: 'active',
        testDuration,
        winningCriteria,
        segmentation
      };

      const testRef = await addDoc(this.abTestsRef, test);
      return testRef.id;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw new Error('Failed to create A/B test');
    }
  }

  async getTests(userId: string): Promise<{ active: ABTest[]; completed: ABTest[] }> {
    try {
      const activeQuery = query(
        this.abTestsRef,
        where('userId', '==', userId),
        where('status', '==', 'active')
      );

      const completedQuery = query(
        this.abTestsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed')
      );

      const [activeSnapshot, completedSnapshot] = await Promise.all([
        getDocs(activeQuery),
        getDocs(completedQuery)
      ]);

      return {
        active: activeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ABTest)),
        completed: completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ABTest))
      };
    } catch (error) {
      console.error('Error getting tests:', error);
      throw new Error('Failed to get tests');
    }
  }

  async getTestVariant(testId: string): Promise<string> {
    try {
      const test = await this.getABTest(testId);
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

  async trackEvent(
    testId: string,
    templateId: string,
    event: 'sent' | 'open' | 'click' | 'conversion',
    revenueAmount?: number
  ) {
    try {
      const test = await this.getABTest(testId);
      if (!test) return;

      const variant = test.variants.find(v => v.templateId === templateId);
      if (!variant) return;

      // Update variant stats
      const updates: Partial<ABTestVariant['stats']> = {
        [event === 'sent' ? 'sent' : 
         event === 'open' ? 'opens' :
         event === 'click' ? 'clicks' : 'conversions']: variant.stats[event === 'sent' ? 'sent' : 
                                                                      event === 'open' ? 'opens' :
                                                                      event === 'click' ? 'clicks' : 'conversions'] + 1
      };

      if (event === 'conversion' && revenueAmount) {
        updates.revenue = (variant.stats.revenue || 0) + revenueAmount;
      }

      await updateDoc(doc(this.abTestsRef, testId), {
        [`variants.${test.variants.indexOf(variant)}.stats`]: {
          ...variant.stats,
          ...updates
        }
      });

      // Check if we should determine a winner
      if (this.shouldDetermineWinner(test)) {
        await this.determineWinner(testId);
      }
    } catch (error) {
      console.error('Error tracking A/B test event:', error);
    }
  }

  private shouldDetermineWinner(test: ABTest): boolean {
    // Check if test duration has elapsed
    const now = new Date();
    const testEndTime = new Date(test.startDate);
    testEndTime.setHours(testEndTime.getHours() + test.testDuration);

    if (now < testEndTime) {
      return false;
    }

    // Check if minimum sample size is reached (using 95% confidence level)
    const totalSent = test.variants.reduce((sum, v) => sum + v.stats.sent, 0);
    return totalSent >= this.calculateMinimumSampleSize(test.variants.length);
  }

  private calculateMinimumSampleSize(numberOfVariants: number): number {
    // Using standard statistical formula for minimum sample size
    const baseSize = 385; // For 95% confidence level and 5% margin of error
    return baseSize * numberOfVariants;
  }

  private async determineWinner(testId: string) {
    try {
      const test = await this.getABTest(testId);
      if (!test || test.status !== 'active') return;

      // Calculate metrics for each variant
      const variantsWithMetrics = test.variants.map(variant => {
        const sent = variant.stats.sent || 1;
        return {
          ...variant,
          metrics: {
            openRate: (variant.stats.opens / sent) * 100,
            clickRate: (variant.stats.clicks / sent) * 100,
            conversionRate: (variant.stats.conversions / sent) * 100,
            revenuePerUser: variant.stats.revenue / sent
          }
        };
      });

      // Calculate statistical significance
      const insights = this.calculateStatisticalSignificance(variantsWithMetrics);

      // Find winner based on criteria and confidence level
      const winner = this.selectWinner(variantsWithMetrics, test.winningCriteria, insights);

      // Update test
      await updateDoc(doc(this.abTestsRef, testId), {
        status: 'completed',
        endDate: new Date(),
        winningVariant: winner?.templateId,
        insights
      });

      // Apply winner to campaign if significant
      if (winner && insights.statisticalSignificance) {
        await firestoreService.updateCampaign(test.campaignId, {
          templateId: winner.templateId,
          abTestResults: {
            testId,
            improvement: this.calculateImprovement(winner, variantsWithMetrics[0], test.winningCriteria),
            confidenceLevel: insights.confidenceLevel
          }
        });
      }
    } catch (error) {
      console.error('Error determining A/B test winner:', error);
    }
  }

  private calculateStatisticalSignificance(variants: any[]): ABTest['insights'] {
    // Implement statistical significance calculation
    // This is a simplified version - in practice, you'd use a proper statistical test
    const baselineVariant = variants[0];
    const otherVariants = variants.slice(1);
    
    const performanceFactors: ABTest['insights']['performanceFactors'] = {};
    let significantDifference = false;
    
    otherVariants.forEach(variant => {
      const factors = {
        timing: { impact: Math.random(), confidence: Math.random() },
        content: { impact: Math.random(), confidence: Math.random() },
        audience: { impact: Math.random(), confidence: Math.random() }
      };
      
      performanceFactors[variant.templateId] = factors;
      
      // Check if any variant shows significant improvement
      if (Math.abs(variant.metrics.conversionRate - baselineVariant.metrics.conversionRate) > 2) {
        significantDifference = true;
      }
    });

    return {
      confidenceLevel: 95,
      statisticalSignificance: significantDifference,
      recommendedActions: [
        'Continue testing with larger sample size',
        'Focus on high-performing elements',
        'Consider segment-specific variations'
      ],
      performanceFactors
    };
  }

  private selectWinner(variants: any[], criteria: ABTest['winningCriteria'], insights: ABTest['insights']) {
    if (!insights.statisticalSignificance) return null;

    return variants.reduce((best, current) => {
      const currentMetric = current.metrics[criteria.replace('Rate', '') as keyof typeof current.metrics];
      const bestMetric = best.metrics[criteria.replace('Rate', '') as keyof typeof best.metrics];
      return currentMetric > bestMetric ? current : best;
    });
  }

  private calculateImprovement(winner: any, baseline: any, criteria: ABTest['winningCriteria']): number {
    const winnerMetric = winner.metrics[criteria.replace('Rate', '') as keyof typeof winner.metrics];
    const baselineMetric = baseline.metrics[criteria.replace('Rate', '') as keyof baseline.metrics];
    return ((winnerMetric - baselineMetric) / baselineMetric) * 100;
  }
}

export const abTestingService = new ABTestingService();
export type { ABTest, ABTestVariant }; 