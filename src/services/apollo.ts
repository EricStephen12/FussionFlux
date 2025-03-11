import { db, auth } from '@/utils/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { presetTemplates } from '@/components/campaigns/presetTemplates';
import axios from 'axios';
import { gql, ApolloClient, InMemoryCache } from '@apollo/client';

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_API_URL = 'https://api.apollo.io/v1';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  linkedinUrl?: string;
  phoneNumber?: string;
  enriched: boolean;
  score?: number;
  lastActivity?: string;
  engagementRate?: number;
}

interface SearchParams {
  title?: string[];
  industry?: string[];
  company_size?: string[];
  location?: string[];
  keywords?: string[];
  limit?: number;
  niche?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  lastModified: string;
  thumbnail?: string;
  blocks: any[];
  automation?: {
    triggerType: 'immediate' | 'scheduled' | 'event-based';
    scheduledDate?: string;
    scheduledTime?: string;
    eventTrigger?: string;
    delay?: number;
    conditions?: string[];
  };
  sms?: {
    enabled: boolean;
    message?: string;
    sendTime?: 'with-email' | 'before-email' | 'after-email';
    delay?: number;
    consent?: boolean;
  };
  analytics?: {
    enableTracking?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    trackConversions?: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export class ApolloService {
  private userId: string | null = null;
  private authInitialized: boolean = false;
  private apolloClient: any;

  // Mapping of our niches to Apollo industry categories
  private readonly NICHE_TO_INDUSTRY_MAP: { [key: string]: string[] } = {
    // Fashion & Accessories
    'Trendy Clothing & Fashion': ['Apparel & Fashion', 'Retail'],
    'Luxury Watches & Accessories': ['Luxury Goods', 'Consumer Goods'],
    'Athleisure & Sportswear': ['Sporting Goods', 'Apparel & Fashion'],
    'Designer Sunglasses': ['Fashion Accessories', 'Luxury Goods'],
    'Handmade Jewelry': ['Jewelry', 'Arts & Crafts'],
    
    // Health & Beauty
    'Natural Skincare Products': ['Cosmetics', 'Health & Wellness'],
    'Organic Beauty Products': ['Cosmetics', 'Organic Products'],
    'Hair Care & Extensions': ['Cosmetics', 'Beauty'],
    'Essential Oils & Aromatherapy': ['Health & Wellness', 'Alternative Medicine'],
    'Vitamins & Supplements': ['Health & Wellness', 'Nutrition'],
    
    // Home & Lifestyle
    'Smart Home Gadgets': ['Consumer Electronics', 'Smart Home'],
    'Kitchen Innovations': ['Consumer Goods', 'Housewares'],
    'Home Decor & Art': ['Home Decor', 'Arts & Crafts'],
    'Eco-Friendly Products': ['Green Technology', 'Environmental Services'],
    'LED Lighting & Decor': ['Lighting', 'Home Decor'],
    
    // Pet Products
    'Premium Pet Supplies': ['Pet Products', 'Consumer Goods'],
    'Pet Fashion & Accessories': ['Pet Products', 'Fashion Accessories'],
    'Pet Health & Wellness': ['Pet Products', 'Veterinary'],
    'Pet Tech Gadgets': ['Pet Products', 'Consumer Electronics'],
    
    // Tech & Gadgets
    'Phone Accessories': ['Mobile', 'Consumer Electronics'],
    'Wireless Earbuds & Audio': ['Consumer Electronics', 'Audio'],
    'Smart Wearables': ['Wearables', 'Consumer Electronics'],
    'Gaming Accessories': ['Gaming', 'Consumer Electronics'],
    'Camera Accessories': ['Photography', 'Consumer Electronics'],
    
    // Outdoor & Sports
    'Camping & Hiking Gear': ['Outdoor Equipment', 'Sporting Goods'],
    'Fitness Equipment': ['Sporting Goods', 'Health & Fitness'],
    'Outdoor Adventure Gear': ['Outdoor Equipment', 'Sporting Goods'],
    'Cycling Accessories': ['Sporting Goods', 'Cycling'],
    'Yoga & Meditation': ['Health & Wellness', 'Fitness'],
    
    // Kids & Babies
    'Educational Toys': ['Education', 'Toys'],
    'Baby Care Products': ['Baby Care', 'Consumer Goods'],
    "Children's Fashion": ['Apparel & Fashion', 'Baby Care'],
    'Baby Safety Products': ['Baby Care', 'Safety'],
    
    // Specialty
    'Car Accessories': ['Automotive', 'Consumer Goods'],
    'Drone Accessories': ['Aviation', 'Consumer Electronics'],
    'Print on Demand': ['Printing', 'E-commerce'],
    'Sustainable Products': ['Environmental Services', 'Green Technology'],
    'Trending TikTok Products': ['E-commerce', 'Social Media']
  };

  constructor() {
    this.apolloClient = axios.create({
      baseURL: APOLLO_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APOLLO_API_KEY}`
      }
    });

    auth.onAuthStateChanged((user) => {
      this.userId = user?.uid || null;
      this.authInitialized = true;
    });
  }

  private async ensureAuth(): Promise<void> {
    if (!this.authInitialized) {
      // Wait for auth to initialize
      await new Promise<void>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        });
      });
    }
    
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
  }

  async searchContacts(params: SearchParams): Promise<Contact[]> {
    try {
      await this.ensureAuth();
      const userDoc = await getDoc(doc(db, 'users', this.userId!));
      const userData = userDoc.data();
      const tier = userData?.subscriptionTier || 'default';

      // Check tier limits
      const tierLimits = {
        pro: { contactsPerSearch: 1000, monthlySearches: 10000, maxLeads: 10000 },
        growth: { contactsPerSearch: 500, monthlySearches: 5000, maxLeads: 5000 },
        starter: { contactsPerSearch: 100, monthlySearches: 1000, maxLeads: 1000 },
        trial: { contactsPerSearch: 25, monthlySearches: 100, maxLeads: 50 }
      };

      const limit = Math.min(
        params.limit || 100,
        tierLimits[tier as keyof typeof tierLimits]?.contactsPerSearch || 25
      );

      // Validate parameters
      if (limit <= 0) {
        throw new Error('Invalid limit for contact search.');
      }

      // Map our niche to Apollo industries
      let industries = params.industry || [];
      if (params.niche && this.NICHE_TO_INDUSTRY_MAP[params.niche]) {
        industries = this.NICHE_TO_INDUSTRY_MAP[params.niche];
      }

      // Search Apollo.io with mapped industries
      const apolloResponse = await this.apolloClient.post('/mixed_people/search', {
        q_organization_industry: industries,
        q_titles: params.title || ['owner', 'founder', 'ceo', 'director', 'manager', 'buyer', 'purchasing'],
        page: 1,
        per_page: limit,
        organization_size_range: params.company_size || ['1-10', '11-50', '51-200'],
      });

      if (!apolloResponse.data || !apolloResponse.data.people) {
        throw new Error('Invalid response structure from Apollo API.');
      }

      const contacts = apolloResponse.data.people.map((person: any) => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        title: person.title,
        company: person.organization?.name,
        industry: person.organization?.industry,
        location: person.location,
        linkedinUrl: person.linkedin_url,
        score: this.calculateLeadScore(person),
        enriched: true,
        lastActivity: person.last_contacted_date || null,
        engagementRate: this.calculateEngagementRate(person)
      }));

      // Store contacts in our database for tracking
      await this.storeContacts(contacts);

      // Track usage
      await this.trackUsage(this.userId!, contacts.length);

      const totalLeadsCollected = userData?.usage?.contactsRetrieved || 0;
      if (totalLeadsCollected + contacts.length > tierLimits[tier].maxLeads) {
        throw new Error('Lead limit exceeded for your subscription tier.');
      }

      return contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw new Error(`Failed to search contacts: ${error.message}`);
    }
  }

  private calculateLeadScore(person: any): number {
    let score = 0;
    
    // Score based on data completeness
    if (person.email) score += 20;
    if (person.linkedin_url) score += 10;
    if (person.organization?.name) score += 10;
    if (person.title) score += 10;
    
    // Score based on seniority
    const seniorityTerms = ['owner', 'founder', 'ceo', 'president', 'director'];
    if (person.title && seniorityTerms.some(term => 
      person.title.toLowerCase().includes(term))) {
      score += 30;
    }

    return Math.min(100, score);
  }

  private calculateEngagementRate(person: any): number {
    let rate = 0;
    if (person.email_response_rate) rate += person.email_response_rate * 0.4;
    if (person.linkedin_connection_degree === 1) rate += 0.3;
    if (person.last_contacted_date) {
      const daysSinceContact = (Date.now() - new Date(person.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceContact < 30) rate += 0.3;
    }
    return Math.min(1, rate);
  }

  private async trackUsage(userId: string, count: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    await updateDoc(userRef, {
      'usage.searches': (userData?.usage?.searches || 0) + 1,
      'usage.contactsRetrieved': (userData?.usage?.contactsRetrieved || 0) + count,
      'usage.lastSearchDate': new Date().toISOString()
    });
  }

  private async storeContacts(contacts: Contact[]): Promise<void> {
    if (!this.userId) return;

    const batch = db.batch();
    const contactsRef = collection(db, 'contacts');

    contacts.forEach(contact => {
      const docRef = doc(contactsRef);
      batch.set(docRef, {
        ...contact,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    });

    await batch.commit();
  }

  async getPresetTemplates() {
    try {
      // First try to get user-specific templates
      if (this.userId) {
        const templatesRef = collection(db, 'templates');
        const q = query(templatesRef, where('userId', '==', this.userId));
        const snapshot = await getDocs(q);
        const userTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (userTemplates.length > 0) {
          return userTemplates;
        }
      }

      // Fall back to preset templates with proper error handling
      return Object.entries(presetTemplates).map(([category, template]) => {
        try {
          return {
            id: template.id || category.toLowerCase().replace(/\s+/g, '-'),
            name: template.name || `${category} Template`,
            category: category,
            description: template.description || `Professional ${category.toLowerCase()} email template`,
            status: template.status || 'active',
            blocks: template.blocks || [],
            isPreset: true,
            thumbnail: `https://source.unsplash.com/random/300x400?${category.toLowerCase().replace(/\s+/g, '-')}`,
            lastModified: template.lastModified || new Date().toISOString()
          };
        } catch (error) {
          console.error(`Error processing template for category ${category}:`, error);
          // Return a safe default template if individual template processing fails
          return {
            id: category.toLowerCase().replace(/\s+/g, '-'),
            name: `${category} Template`,
            category: category,
            description: `Professional ${category.toLowerCase()} email template`,
            status: 'active',
            blocks: [],
            isPreset: true,
            thumbnail: `https://source.unsplash.com/random/300x400?email`,
      lastModified: new Date().toISOString()
    };
        }
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      // Always fall back to preset templates with safe defaults
      return Object.entries(presetTemplates).map(([category]) => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: `${category} Template`,
        category: category,
        description: `Professional ${category.toLowerCase()} email template`,
        status: 'active',
        blocks: [],
        isPreset: true,
        thumbnail: `https://source.unsplash.com/random/300x400?email`,
        lastModified: new Date().toISOString()
      }));
    }
  }

  async getUserTemplates() {
    try {
      await this.ensureAuth();

      const templatesRef = collection(db, 'templates');
      const q = query(templatesRef, where('userId', '==', this.userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user templates:', error);
      if (error instanceof Error && error.message === 'User not authenticated') {
        throw new Error('Please sign in to access your templates');
      }
      return [];
    }
  }

  async saveTemplate(template: Template): Promise<Template> {
    try {
      await this.ensureAuth();

      const templatesRef = collection(db, 'templates');
      if (template.id) {
        const templateDoc = doc(db, 'templates', template.id);
        await updateDoc(templateDoc, {
          ...template,
          userId: this.userId,
          lastModified: new Date().toISOString()
        });
      } else {
        const docRef = await addDoc(templatesRef, {
          ...template,
          userId: this.userId,
          lastModified: new Date().toISOString()
        });
        template.id = docRef.id;
      }
      return template;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await this.ensureAuth();

      const templateDoc = doc(db, 'templates', id);
      const template = await getDoc(templateDoc);
      
      if (!template.exists() || template.data()?.userId !== this.userId) {
        throw new Error('Template not found or unauthorized');
      }

      await deleteDoc(templateDoc);
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async scoreLeads(contacts: Contact[], userCriteria: any): Promise<Contact[]> {
    return contacts.map(contact => {
      let score = 0;
      
      // Score based on engagement rate
      if (contact.engagementRate) {
        score += contact.engagementRate * 40; // Up to 40 points for engagement
      }

      // Score based on industry match
      if (userCriteria.industries?.includes(contact.industry)) {
        score += 20;
      }

      // Score based on recent activity
      if (contact.lastActivity) {
        const daysSinceActivity = (new Date().getTime() - new Date(contact.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceActivity < 7) score += 20;
        else if (daysSinceActivity < 30) score += 10;
      }

      // Score based on completeness of profile
      const profileFields = ['firstName', 'lastName', 'email', 'title', 'company', 'industry', 'location'];
      const completeness = profileFields.filter(field => contact[field as keyof Contact]).length / profileFields.length;
      score += completeness * 20;

    return {
        ...contact,
        score: Math.min(100, Math.round(score)) // Cap at 100
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score descending
  }

  async getTemplates(): Promise<Template[]> {
    // Implement the logic to fetch templates from the server or local storage
    return presetTemplates;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    await this.ensureAuth();
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('userId', '==', this.userId), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export const apolloService = new ApolloService();

// Initialize Apollo Client
const client = new ApolloClient({
  uri: 'YOUR_GRAPHQL_ENDPOINT',
  cache: new InMemoryCache(),
});

// Define a query to fetch leads
const FETCH_LEADS = gql`
  query FetchLeads($limit: Int!) {
    leads(limit: $limit) {
      id
      name
      email
    }
  }
`;

// Function to fetch leads
export const fetchLeads = async (limit: number) => {
  try {
    const { data } = await client.query({
      query: FETCH_LEADS,
      variables: { limit },
    });
    return data.leads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw new Error('Failed to fetch leads');
  }
};

// Function to fetch leads with scoring
export const fetchScoredLeads = async (limit: number) => {
  const leads = await fetchLeads(limit);
  return leads.map(lead => ({
    ...lead,
    score: Math.random() * 100, // Placeholder for AI-powered scoring logic
  }));
};