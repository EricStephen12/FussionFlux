import axios from 'axios';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

interface ApolloContact {
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
}

interface SearchParams {
  title?: string[];
  industry?: string[];
  company_size?: string[];
  location?: string[];
  keywords?: string[];
  limit?: number;
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
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  sent: number;
  opened: number;
  clicked: number;
  startDate: string;
}

export class ApolloService {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';
  private client: ApolloClient<any>;
  private templates: Template[] = [];
  private campaigns: Campaign[] = [];

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_APOLLO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Apollo API key not found');
    }

    this.client = new ApolloClient({
      uri: process.env.NEXT_PUBLIC_APOLLO_URI,
      cache: new InMemoryCache(),
      headers: {
        'x-api-key': this.apiKey,
      },
    });
  }

  async searchContacts(params: SearchParams): Promise<ApolloContact[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/people/search`,
        {
          ...params,
          api_key: this.apiKey,
        }
      );

      return response.data.people.map(this.formatContact);
    } catch (error) {
      console.error('Error searching Apollo contacts:', error);
      throw error;
    }
  }

  async enrichContact(email: string): Promise<ApolloContact | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/people/match`,
        {
          email,
          api_key: this.apiKey,
        }
      );

      if (!response.data.person) return null;
      return this.formatContact(response.data.person);
    } catch (error) {
      console.error('Error enriching contact:', error);
      return null;
    }
  }

  async getContactsByDomain(domain: string, limit = 100): Promise<ApolloContact[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/people/search`,
        {
          domain,
          limit,
          api_key: this.apiKey,
        }
      );

      return response.data.people.map(this.formatContact);
    } catch (error) {
      console.error('Error getting contacts by domain:', error);
      throw error;
    }
  }

  async createAudience(name: string, filters: SearchParams): Promise<string> {
    try {
      const contacts = await this.searchContacts(filters);
      
      const audience = {
        name,
        filters,
        contacts: contacts.map(c => c.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return 'audience_' + Date.now();
    } catch (error) {
      console.error('Error creating audience:', error);
      throw error;
    }
  }

  async updateAudience(audienceId: string, filters: SearchParams): Promise<void> {
    try {
      const contacts = await this.searchContacts(filters);
      
      const audience = {
        filters,
        contacts: contacts.map(c => c.id),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error updating audience:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<Template[]> {
    // TODO: Replace with actual API call
    return this.templates;
  }

  async getTemplateCategories(): Promise<string[]> {
    try {
      const { data } = await this.client.query({
        query: gql`
          query GetTemplateCategories {
            templateCategories
          }
        `,
      });
      return data.templateCategories;
    } catch (error) {
      console.error('Error fetching template categories:', error);
      return ['newsletter', 'promotional', 'transactional'];
    }
  }

  async saveTemplate(template: Template): Promise<Template> {
    // TODO: Replace with actual API call
    const index = this.templates.findIndex(t => t.id === template.id);
    if (index === -1) {
      this.templates.push(template);
    } else {
      this.templates[index] = template;
    }
    return template;
  }

  async sendTestEmail(templateId: string, email: string): Promise<boolean> {
    try {
      const { data } = await this.client.mutate({
        mutation: gql`
          mutation SendTestEmail($templateId: ID!, $email: String!) {
            sendTestEmail(templateId: $templateId, email: $email)
          }
        `,
        variables: { templateId, email },
      });
      return data.sendTestEmail;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  }

  async getTemplate(id: string): Promise<Template | null> {
    // TODO: Replace with actual API call
    const template = this.templates.find(t => t.id === id);
    return template || null;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    // TODO: Replace with actual API call
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  async getPresetTemplates() {
    const { data } = await this.client.query({
      query: gql`
        query GetPresetTemplates {
          presetTemplates {
            id
            name
            category
            description
            status
            blocks
            isPreset
            thumbnail
            lastModified
          }
        }
      `,
    });
    return data.presetTemplates;
  }

  async getUserTemplates() {
    const { data } = await this.client.query({
      query: gql`
        query GetUserTemplates {
          userTemplates {
            id
            name
            category
            description
            status
            blocks
            isPreset
            thumbnail
            lastModified
          }
        }
      `,
    });
    return data.userTemplates;
  }

  async createCampaign(campaign: any) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation CreateCampaign($campaign: CampaignInput!) {
          createCampaign(campaign: $campaign) {
            id
            name
            templateId
            status
            schedule
            audience {
              total
              segments
            }
            stats {
              sent
              opened
              clicked
              bounced
            }
          }
        }
      `,
      variables: { campaign },
    });
    return data.createCampaign;
  }

  async getCampaign(campaignId: string) {
    const { data } = await this.client.query({
      query: gql`
        query GetCampaign($id: ID!) {
          campaign(id: $id) {
            id
            name
            templateId
            status
            schedule
            audience {
              total
              segments
            }
            stats {
              sent
              opened
              clicked
              bounced
            }
          }
        }
      `,
      variables: { id: campaignId },
    });
    return data.campaign;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    // TODO: Replace with actual API call
    return this.campaigns;
  }

  async pauseCampaign(campaignId: string) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation PauseCampaign($id: ID!) {
          pauseCampaign(id: $id) {
            id
            status
          }
        }
      `,
      variables: { id: campaignId },
    });
    return data.pauseCampaign;
  }

  async resumeCampaign(campaignId: string) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation ResumeCampaign($id: ID!) {
          resumeCampaign(id: $id) {
            id
            status
          }
        }
      `,
      variables: { id: campaignId },
    });
    return data.resumeCampaign;
  }

  async deleteCampaign(campaignId: string) {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation DeleteCampaign($id: ID!) {
          deleteCampaign(id: $id)
        }
      `,
      variables: { id: campaignId },
    });
    return data.deleteCampaign;
  }

  async getAudienceSegments() {
    const { data } = await this.client.query({
      query: gql`
        query GetAudienceSegments {
          audienceSegments {
            id
            name
            count
            criteria
          }
        }
      `,
    });
    return data.audienceSegments;
  }

  async searchContacts(query: string, niche: string, limit: number) {
    const { data } = await this.client.query({
      query: gql`
        query SearchContacts($query: String!, $niche: String!, $limit: Int!) {
          searchContacts(query: $query, niche: $niche, limit: $limit) {
            email
            name
            company
            title
            niche
          }
        }
      `,
      variables: { query, niche, limit },
    });
    return data.searchContacts;
  }

  async getCampaignAnalytics(campaignId: string) {
    try {
      const { data } = await this.client.query({
        query: gql`
          query GetCampaignAnalytics($id: ID!) {
            campaignAnalytics(id: $id) {
              sent
              delivered
              opened
              clicked
              bounced
              unsubscribed
              complaints
              timeline {
                timestamp
                event
                count
              }
              deviceStats {
                desktop
                mobile
                tablet
              }
              locationStats {
                country
                count
              }
            }
          }
        `,
        variables: { id: campaignId },
      });
      return data.campaignAnalytics;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  }

  async duplicateTemplate(id: string): Promise<Template | null> {
    // TODO: Replace with actual API call
    const template = await this.getTemplate(id);
    if (!template) return null;

    const newTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      status: 'draft' as const,
      lastModified: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  private formatContact(apolloContact: any): ApolloContact {
    return {
      id: apolloContact.id,
      firstName: apolloContact.first_name,
      lastName: apolloContact.last_name,
      email: apolloContact.email,
      title: apolloContact.title,
      company: apolloContact.organization?.name,
      industry: apolloContact.organization?.industry,
      location: `${apolloContact.city || ''}, ${apolloContact.state || ''}, ${apolloContact.country || ''}`.trim(),
      linkedinUrl: apolloContact.linkedin_url,
      phoneNumber: apolloContact.phone_number,
      enriched: true,
    };
  }
}