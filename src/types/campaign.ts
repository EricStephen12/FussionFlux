   // src/types/campaign.ts
   export interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'completed';
    // Add other relevant properties
  }