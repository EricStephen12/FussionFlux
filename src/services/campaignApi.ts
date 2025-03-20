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