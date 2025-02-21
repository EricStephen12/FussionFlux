import { db } from '@/utils/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { domainVerificationService } from './domain-verification';

interface WhiteLabelConfig {
  enabled: boolean;
  companyName: string;
  domain: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  customCss?: string;
  customJs?: string;
  emailSettings: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    footer: string;
  };
}

interface AgencyPlan {
  id: string;
  name: string;
  maxClients: number;
  maxEmailsPerMonth: number;
  customDomain: boolean;
  price: number;
  features: string[];
}

const AGENCY_PLANS: AgencyPlan[] = [
  {
    id: 'agency-starter',
    name: 'Agency Starter',
    maxClients: 5,
    maxEmailsPerMonth: 50000,
    customDomain: false,
    price: 199,
    features: [
      'White-label dashboard',
      'Basic customization',
      'Email support',
      'Basic analytics'
    ]
  },
  {
    id: 'agency-pro',
    name: 'Agency Professional',
    maxClients: 15,
    maxEmailsPerMonth: 150000,
    customDomain: true,
    price: 499,
    features: [
      'Custom domain',
      'Advanced customization',
      'Priority support',
      'Advanced analytics',
      'Client management tools',
      'API access'
    ]
  },
  {
    id: 'agency-enterprise',
    name: 'Agency Enterprise',
    maxClients: 50,
    maxEmailsPerMonth: 500000,
    customDomain: true,
    price: 999,
    features: [
      'Multiple custom domains',
      'Full customization',
      'Dedicated support',
      'Enterprise analytics',
      'Advanced API access',
      'Custom integrations',
      'Dedicated IP'
    ]
  }
];

class WhiteLabelService {
  async getConfig(userId: string): Promise<WhiteLabelConfig | null> {
    try {
      const docRef = doc(db, 'white_label_config', userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return docSnap.data() as WhiteLabelConfig;
    } catch (error) {
      console.error('Error fetching white-label config:', error);
      return null;
    }
  }

  async updateConfig(userId: string, config: Partial<WhiteLabelConfig>): Promise<boolean> {
    try {
      const docRef = doc(db, 'white_label_config', userId);
      await updateDoc(docRef, config);
      
      // If domain is being updated, verify it
      if (config.domain) {
        await this.verifyDomain(userId, config.domain);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating white-label config:', error);
      return false;
    }
  }

  private async verifyDomain(userId: string, domain: string): Promise<boolean> {
    try {
      const result = await domainVerificationService.addDomain(domain);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Store DNS records for later verification
      await updateDoc(doc(db, 'white_label_config', userId), {
        domainVerification: {
          status: 'pending',
          records: result.records,
          timestamp: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error verifying domain:', error);
      return false;
    }
  }

  async addClient(
    agencyId: string,
    clientData: {
      name: string;
      email: string;
      company: string;
    }
  ): Promise<string | null> {
    try {
      // Check if agency has reached client limit
      const agencyDoc = await getDoc(doc(db, 'users', agencyId));
      const agencyData = agencyDoc.data();
      const plan = AGENCY_PLANS.find(p => p.id === agencyData?.agencyPlan);
      
      if (!plan) {
        throw new Error('Invalid agency plan');
      }

      const currentClients = await this.getClientCount(agencyId);
      if (currentClients >= plan.maxClients) {
        throw new Error('Client limit reached for current plan');
      }

      // Add client
      const clientRef = await addDoc(collection(db, 'agency_clients'), {
        agencyId,
        ...clientData,
        createdAt: new Date(),
        status: 'active'
      });

      return clientRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      return null;
    }
  }

  async getClientCount(agencyId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'agency_clients'),
        where('agencyId', '==', agencyId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting client count:', error);
      return 0;
    }
  }

  async upgradeAgencyPlan(userId: string, planId: string): Promise<boolean> {
    try {
      const plan = AGENCY_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      await updateDoc(doc(db, 'users', userId), {
        agencyPlan: planId,
        agencyPlanUpdatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error upgrading agency plan:', error);
      return false;
    }
  }

  getAgencyPlans(): AgencyPlan[] {
    return AGENCY_PLANS;
  }

  async generateClientReport(clientId: string): Promise<any> {
    try {
      const clientDoc = await getDoc(doc(db, 'agency_clients', clientId));
      if (!clientDoc.exists()) {
        throw new Error('Client not found');
      }

      // Get client's campaign stats
      const campaigns = await this.getClientCampaigns(clientId);
      
      // Calculate metrics
      const metrics = this.calculateClientMetrics(campaigns);

      return {
        client: clientDoc.data(),
        campaigns,
        metrics,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating client report:', error);
      return null;
    }
  }

  private async getClientCampaigns(clientId: string): Promise<any[]> {
    const q = query(
      collection(db, 'campaigns'),
      where('clientId', '==', clientId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  private calculateClientMetrics(campaigns: any[]) {
    return {
      totalCampaigns: campaigns.length,
      totalEmails: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
      averageOpenRate: this.calculateAverage(campaigns, 'openRate'),
      averageClickRate: this.calculateAverage(campaigns, 'clickRate'),
      totalConversions: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)
    };
  }

  private calculateAverage(campaigns: any[], field: string): number {
    const validCampaigns = campaigns.filter(c => c[field]);
    if (validCampaigns.length === 0) return 0;
    
    const sum = validCampaigns.reduce((sum, c) => sum + c[field], 0);
    return sum / validCampaigns.length;
  }
}

export const whiteLabelService = new WhiteLabelService();
export type { WhiteLabelConfig, AgencyPlan }; 