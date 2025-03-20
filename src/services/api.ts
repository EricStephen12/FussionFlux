import { AnalyticsService } from './analytics';
import { firestoreService } from './firestore';

const analyticsService = new AnalyticsService();

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  lastModified: string;
  blocks: any[];
}

// Simulated function to fetch saved templates
export const fetchSavedTemplates = async (): Promise<Template[]> => {
  // Simulated data
  return [
    { id: '1', name: 'Template 1', category: 'Category 1', description: 'Description 1', status: 'draft', lastModified: '2023-01-01', blocks: [] },
    { id: '2', name: 'Template 2', category: 'Category 2', description: 'Description 2', status: 'published', lastModified: '2023-01-02', blocks: [] },
    { id: '3', name: 'Template 3', category: 'Category 3', description: 'Description 3', status: 'draft', lastModified: '2023-01-03', blocks: [] }
  ];
};

// Function to save a template
export const saveTemplate = async (template: Template): Promise<void> => {
  // Simulated API call to save the template
  console.log('Saving template:', template);
  // Here you would typically make an API call to save the template
  // For example: await axios.post('/api/templates', template);
};

export const fetchCampaignAnalytics = async (campaignId: string) => {
  const response = await fetch(`/api/campaigns/${campaignId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch campaign analytics');
  }
  return response.json();
};

export const updateCampaignStatus = async (campaignId: string, status: string) => {
  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update campaign status');
  }
  return response.json();
};

export const fetchUsedEmails = async (): Promise<number> => {
  try {
    const stats = await firestoreService.getUserStats();
    return stats?.emailsSent || 0;
  } catch (error) {
    console.error('Error fetching used emails:', error);
    return 0;
  }
};

export const fetchUsedSMS = async (): Promise<number> => {
  try {
    const stats = await firestoreService.getUserStats();
    return stats?.smsSent || 0;
  } catch (error) {
    console.error('Error fetching used SMS:', error);
    return 0;
  }
}; 