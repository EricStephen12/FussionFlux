// Client-side Apollo service that uses API routes instead of direct Firebase Admin SDK

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
  industry?: string[];
  title?: string[];
  limit?: number;
}

class ApolloClientService {
  private async getAuthToken(): Promise<string> {
    // Get the token from cookies
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session='));
    if (sessionCookie) {
      return sessionCookie.split('=')[1].trim();
    }
    return '';
  }

  async searchContacts(params: SearchParams): Promise<Contact[]> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch('/api/apollo/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search contacts');
      }

      const data = await response.json();
      return data.contacts || [];
    } catch (error: any) {
      console.error('Apollo search error:', error);
      throw new Error(error.message || 'Failed to search contacts');
    }
  }

  // Map of our niches to Apollo industry categories
  readonly NICHE_TO_INDUSTRY_MAP: { [key: string]: string[] } = {
    'E-commerce': ['E-Commerce', 'Retail', 'Consumer Goods'],
    'SaaS': ['SaaS', 'Software', 'Information Technology'],
    'Digital Agency': ['Marketing and Advertising', 'Digital Marketing', 'Creative Agency'],
    'Retail': ['Retail', 'Consumer Goods', 'Fashion'],
    'B2B Services': ['Business Services', 'Professional Services', 'Consulting'],
    'Health & Wellness': ['Health, Wellness and Fitness', 'Healthcare', 'Medical'],
    'Education': ['Education', 'E-Learning', 'EdTech'],
    'Finance': ['Financial Services', 'Banking', 'Insurance'],
    'Real Estate': ['Real Estate', 'Property Management', 'Construction'],
    'Travel': ['Travel & Tourism', 'Hospitality', 'Leisure'],
    'Food & Beverage': ['Food & Beverages', 'Restaurants', 'Catering'],
    'Technology': ['Information Technology', 'Computer Software', 'Internet']
  };

  // Map of our niches to common job titles
  readonly NICHE_TO_TITLES_MAP: { [key: string]: string[] } = {
    'E-commerce': ['E-commerce Manager', 'Digital Marketing Manager', 'Online Store Manager', 'E-commerce Director'],
    'SaaS': ['CTO', 'VP of Engineering', 'Product Manager', 'Software Engineer'],
    'Digital Agency': ['Marketing Director', 'Digital Strategist', 'Agency Owner', 'Creative Director'],
    'Retail': ['Store Manager', 'Retail Director', 'Merchandising Manager', 'Buyer'],
    'B2B Services': ['Operations Manager', 'Business Development', 'Account Manager', 'Sales Director'],
    'Health & Wellness': ['Wellness Director', 'Fitness Manager', 'Health Coach', 'Spa Manager'],
    'Education': ['Principal', 'Dean', 'Education Director', 'Program Coordinator'],
    'Finance': ['Financial Advisor', 'Accountant', 'Finance Manager', 'CFO'],
    'Real Estate': ['Real Estate Agent', 'Property Manager', 'Broker', 'Leasing Manager'],
    'Travel': ['Travel Agent', 'Tour Operator', 'Destination Manager', 'Hospitality Manager'],
    'Food & Beverage': ['Restaurant Manager', 'F&B Director', 'Chef', 'Catering Manager'],
    'Technology': ['IT Manager', 'System Administrator', 'Network Engineer', 'IT Director']
  };

  getIndustriesForNiche(niche: string): string[] {
    return this.NICHE_TO_INDUSTRY_MAP[niche] || ['Software'];
  }

  getTitlesForNiche(niche: string): string[] {
    return this.NICHE_TO_TITLES_MAP[niche] || ['Manager'];
  }
}

export const apolloClientService = new ApolloClientService(); 