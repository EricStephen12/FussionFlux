import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import TemplateEditor from '../../components/campaigns/TemplateEditor';

const NewCampaignPage = () => {
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
    // Handle save logic here
  };

  const handleCancel = () => {
    // Handle cancel logic here
    window.history.back();
  };

  return (
    <div className="min-h-screen">
      <TemplateEditor
        template={emptyTemplate}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default NewCampaignPage;
