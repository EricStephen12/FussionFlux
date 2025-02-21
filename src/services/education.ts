import { db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'guide' | 'tutorial' | 'case-study' | 'tips';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimatedTime: number; // in minutes
  lastUpdated: Date;
}

interface GuideSection {
  title: string;
  content: string;
  videoUrl?: string;
  resources?: string[];
}

const DROPSHIPPING_GUIDES = {
  gettingStarted: {
    title: 'Getting Started with Dropshipping',
    sections: [
      {
        title: 'Understanding Dropshipping',
        content: `Dropshipping is a business model where you sell products without holding inventory. 
                 When a customer makes a purchase, the order is forwarded to your supplier who ships 
                 directly to the customer.`,
      },
      {
        title: 'Finding Your Niche',
        content: `Choose a specific market segment to target. Consider factors like:
                 - Market demand
                 - Competition level
                 - Product pricing and margins
                 - Your interests and expertise`,
      },
      {
        title: 'Setting Up Your Store',
        content: `Steps to launch your store:
                 1. Choose your platform (e.g., Shopify)
                 2. Select your domain name
                 3. Design your store
                 4. Set up payment processing
                 5. Configure shipping settings`,
      }
    ]
  },
  emailMarketing: {
    title: 'Email Marketing for Dropshipping Success',
    sections: [
      {
        title: 'Building Your Email List',
        content: `Strategies for growing your email list:
                 - Offer valuable lead magnets
                 - Use exit-intent popups
                 - Run social media campaigns
                 - Implement referral programs`,
      },
      {
        title: 'Creating Converting Campaigns',
        content: `Key elements of successful email campaigns:
                 - Compelling subject lines
                 - Personalized content
                 - Clear call-to-actions
                 - Mobile-friendly design
                 - A/B testing strategies`,
      },
      {
        title: 'Automation and Sequences',
        content: `Essential email automations:
                 - Welcome series
                 - Abandoned cart recovery
                 - Post-purchase follow-up
                 - Win-back campaigns`,
      }
    ]
  },
  productResearch: {
    title: 'Product Research and Selection',
    sections: [
      {
        title: 'Finding Winning Products',
        content: `Methods to identify profitable products:
                 - Trend analysis
                 - Competition research
                 - Profit margin calculation
                 - Supplier evaluation`,
      },
      {
        title: 'Product Validation',
        content: `Steps to validate product potential:
                 - Market demand analysis
                 - Customer feedback collection
                 - Small-scale testing
                 - Competition analysis`,
      }
    ]
  }
};

class EducationService {
  async getResource(resourceId: string): Promise<Resource | null> {
    try {
      const docRef = doc(db, 'educational_resources', resourceId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Resource;
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  }

  async getResourcesByCategory(category: Resource['category']): Promise<Resource[]> {
    try {
      const q = query(
        collection(db, 'educational_resources'),
        where('category', '==', category),
        orderBy('lastUpdated', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
    } catch (error) {
      console.error('Error fetching resources by category:', error);
      return [];
    }
  }

  async getRecommendedResources(userId: string): Promise<Resource[]> {
    try {
      // Get user's activity and preferences
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      // Build query based on user's level and interests
      const q = query(
        collection(db, 'educational_resources'),
        where('difficulty', '==', userData?.skill_level || 'beginner'),
        where('tags', 'array-contains-any', userData?.interests || ['getting-started']),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
    } catch (error) {
      console.error('Error fetching recommended resources:', error);
      return [];
    }
  }

  getDropshippingGuides() {
    return DROPSHIPPING_GUIDES;
  }

  getGuideBySlug(slug: keyof typeof DROPSHIPPING_GUIDES) {
    return DROPSHIPPING_GUIDES[slug];
  }

  getAllGuides(): Array<{slug: string; title: string; description: string}> {
    return Object.entries(DROPSHIPPING_GUIDES).map(([slug, guide]) => ({
      slug,
      title: guide.title,
      description: guide.sections[0].content.slice(0, 150) + '...'
    }));
  }

  getEmailMarketingBestPractices(): string[] {
    return [
      'Segment your email list based on customer behavior and preferences',
      'Personalize email content using customer data and purchase history',
      'Use A/B testing to optimize subject lines and content',
      'Implement automated email sequences for different customer journeys',
      'Monitor and analyze email campaign metrics to improve performance',
      'Focus on mobile-friendly email design',
      'Include clear and compelling calls-to-action',
      'Maintain a consistent sending schedule',
      'Clean your email list regularly to maintain high deliverability',
      'Follow email marketing regulations and best practices'
    ];
  }

  getProductResearchTips(): string[] {
    return [
      'Research current market trends using tools like Google Trends',
      'Analyze competitor products and pricing strategies',
      'Calculate potential profit margins including all costs',
      'Check product reviews and customer feedback',
      'Verify supplier reliability and shipping times',
      'Consider seasonal trends and demand patterns',
      'Test products with small orders before scaling',
      'Monitor social media for trending products',
      'Use analytics tools to track product performance',
      'Stay updated with industry news and developments'
    ];
  }
}

export const educationService = new EducationService();
export type { Resource, GuideSection }; 