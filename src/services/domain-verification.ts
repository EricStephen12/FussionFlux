import { Resend } from 'resend';

class DomainVerificationService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Resend API key is not configured');
    }
    this.resend = new Resend(apiKey);
  }

  async addDomain(domain: string): Promise<{
    success: boolean;
    records?: {
      type: string;
      name: string;
      value: string;
      ttl: number;
    }[];
    error?: string;
  }> {
    try {
      const { data: domain_data, error } = await this.resend.domains.create({ name: domain });
      
      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        records: domain_data.records
      };
    } catch (error: any) {
      console.error('Error adding domain:', error);
      return {
        success: false,
        error: error.message || 'Failed to add domain'
      };
    }
  }

  async verifyDomain(domain: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const { data: domain_data, error } = await this.resend.domains.verify(domain);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        status: domain_data.status
      };
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify domain'
      };
    }
  }

  async getDomainStatus(domain: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const { data: domain_data, error } = await this.resend.domains.get(domain);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        status: domain_data.status
      };
    } catch (error: any) {
      console.error('Error getting domain status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get domain status'
      };
    }
  }
}

export const domainVerificationService = new DomainVerificationService(); 