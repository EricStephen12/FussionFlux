import { db } from '@/utils/firebase-client';
import { getApolloApiKey } from '@/utils/api-keys';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { presetTemplates } from '@/components/campaigns/presetTemplates';
import axios from 'axios';
import { gql, ApolloClient, InMemoryCache } from '@apollo/client';

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

// Mock data for user templates
const userTemplates = [
  {
    id: 'user-template-1',
    name: 'My Custom Template',
    category: 'Custom',
    description: 'A custom template created for my dropshipping business',
    status: 'draft',
    updatedAt: new Date().toISOString(),
    thumbnail: 'https://source.unsplash.com/random/300x400?custom',
    blocks: [
      {
        id: 'header-custom-1',
        type: 'header',
        content: {
          title: 'Custom Template Header',
          subtitle: 'Created for my business',
          alignment: 'center',
          background: '#ffffff',
          textColor: '#333333'
        }
      },
      {
        id: 'text-custom-1',
        type: 'text',
        content: {
          text: 'This is my custom template text that I created for my business.',
          alignment: 'center',
          textColor: '#333333',
          fontSize: '16px'
        }
      }
    ]
  }
];

// Apollo service for interacting with templates and contacts
class ApolloService {
  private apiKey: string;
  private apolloClient: any;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_APOLLO_API_KEY || '';
    this.apolloClient = new ApolloClient({
      uri: 'https://app.apollo.io/api/v1/graphql',
      cache: new InMemoryCache(),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Apollo-Key': this.apiKey
    };
  }

  async searchContacts({ industry, title, limit = 100 }: { 
    industry: string[],
    title: string[],
    limit: number 
  }) {
    try {
      const params = new URLSearchParams();
      
      if (title && title.length > 0) {
        params.append('title', title.join(','));
      }
      
      if (industry && industry.length > 0) {
        params.append('industry', industry.join(','));
      }
      
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/apollo?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const contacts = await response.json();
      return contacts;
    } catch (error) {
      console.error('Error searching contacts:', error);
      
      return Array(limit).fill(null).map((_, index) => ({
        id: `contact_${index}`,
        firstName: `First${index}`,
        lastName: `Last${index}`,
        email: `contact${index}@example.com`,
        title: ['CEO', 'Marketing Manager', 'Owner', 'Director'][Math.floor(Math.random() * 4)],
        company: `Company ${index}`,
        industry: industry && industry.length > 0 ? industry[0] : 'Technology',
        location: 'United States',
        enriched: true,
        score: Math.floor(Math.random() * 30) + 70,
        engagementRate: Math.random() * 0.7
      }));
    }
  }

  async enrichContact(email: string) {
    try {
      const response = await fetch('/api/apollo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to enrich contact');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error enriching contact:', error);
      return null;
    }
  }

  async verifyEmail(email: string) {
    try {
      const response = await fetch('https://api.apollo.io/v1/email_verifications', {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          api_key: this.apiKey,
          email
        })
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        isValid: data.status === 'valid',
        confidence: data.confidence,
        status: data.status
      };
    } catch (error: any) {
      console.error('Apollo email verification error:', error);
      throw new Error(error.message || 'Failed to verify email');
    }
  }

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

  async searchContactsFirebase(params: SearchParams): Promise<Contact[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', params.userId));
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
      const apolloResponse = await this.apolloClient.query({
        query: gql`
          query FetchLeads($limit: Int!) {
            leads(limit: $limit) {
              id
              name
              email
            }
          }
        `,
        variables: { limit },
      });

      if (!apolloResponse.data || !apolloResponse.data.leads) {
        throw new Error('Invalid response structure from Apollo API.');
      }

      const contacts = apolloResponse.data.leads.map((person: any) => ({
        id: person.id,
        firstName: person.name.split(' ')[0],
        lastName: person.name.split(' ')[1] || '',
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
      await this.trackUsage(params.userId, contacts.length);

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
    const batch = db.batch();
    const contactsRef = collection(db, 'contacts');

    contacts.forEach(contact => {
      const docRef = doc(contactsRef);
      batch.set(docRef, {
        ...contact,
        userId: contact.userId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    });

    await batch.commit();
  }

  async getPresetTemplates() {
    try {
      // Convert the presetTemplates object to an array
      // The presetTemplates is a flat Record<string, Template> and not categories
      const templates = Object.keys(presetTemplates).map(key => {
        // Add the key as the id if not present
        return {
          id: key,
          ...presetTemplates[key]
        };
      });
      
      return templates;
    } catch (error) {
      console.error('Error preparing preset templates:', error);
      // Return an empty array instead of undefined to prevent spread operator issues
      return [];
    }
  }

  async getUserTemplates() {
    return userTemplates;
  }

  async saveTemplate(template: Template): Promise<Template> {
    try {
      const templatesRef = collection(db, 'templates');
      if (template.id) {
        const templateDoc = doc(db, 'templates', template.id);
        await updateDoc(templateDoc, {
          ...template,
          userId: null,
          lastModified: new Date().toISOString()
        });
      } else {
        const docRef = await addDoc(templatesRef, {
          ...template,
          userId: null,
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
      const templateDoc = doc(db, 'templates', id);
      const template = await getDoc(templateDoc);
      
      if (!template.exists() || template.data()?.userId !== null) {
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
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('userId', '==', null));
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