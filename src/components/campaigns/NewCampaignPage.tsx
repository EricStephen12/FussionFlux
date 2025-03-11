import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import TemplateEditor from '../../components/campaigns/TemplateEditor';
import withAuth from '@/utils/withAuth';
import { getLeadPacks } from '../../services/LeadService'; // Import the new lead packs service

const NewCampaignPage: React.FC = () => {
  // Create an empty template structure
  const emptyTemplate = {
    id: uuidv4(),
    name: 'New Template',
    category: 'promotional',
    blocks: [],
    isPreset: false
  };

  const handleSave = async (template: any) => {
    console.log('Template saved:', template);
    // Implement actual save logic here, e.g., API call to save the template
  };

  const handleCancel = () => {
    // Handle cancel logic here
    window.history.back();
  };

  // Fetch lead packs to display in the campaign creation flow
  const leadPacks = getLeadPacks();

  return (
    <div className="min-h-screen">
      <h2>Select Your Lead Pack</h2>
      <ul>
        {leadPacks.map(pack => (
          <li key={pack.name}>
            {pack.name}: {pack.leads} leads for ${pack.price}
          </li>
        ))}
      </ul>
      <TemplateEditor
        template={emptyTemplate}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default withAuth(NewCampaignPage); 