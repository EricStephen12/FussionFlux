// Define lead packs for the new pricing model
export interface LeadPack {
  name: string;
  leads: number;
  price: number;
  costPerLead: number;
}

const leadPacks: LeadPack[] = [
  { name: 'Starter', leads: 1000, price: 39, costPerLead: 0.039 },
  { name: 'Grower', leads: 5000, price: 99, costPerLead: 0.019 },
  { name: 'Pro', leads: 10000, price: 199, costPerLead: 0.019 },
  { name: 'Scaling', leads: 25000, price: 399, costPerLead: 0.015 },
];

// Function to return lead packs
export const getLeadPacks = () => leadPacks; 