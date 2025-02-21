import CampaignAnalytics from './CampaignAnalytics';

const CampaignDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Existing dashboard content */}
      {campaigns.map(campaign => (
        <div key={campaign.id} className="p-4 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">{campaign.name}</h3>
          <CampaignAnalytics campaignId={campaign.id} />
        </div>
      ))}
    </div>
  );
};

export default CampaignDashboard; 