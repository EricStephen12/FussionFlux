import React from 'react';
import { useRouter } from 'next/router';
import { Template } from '../../services/api';

interface ReviewCampaignProps {
  template: Template;
  audience: any[];
  onConfirm: () => void;
  onEdit: () => void;
}

const ReviewCampaign: React.FC<ReviewCampaignProps> = ({ template, audience, onConfirm, onEdit }) => {
  const router = useRouter();

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Review Your Campaign</h2>
      <div className="mt-4">
        <h3 className="text-md font-medium">Template Details</h3>
        <p><strong>Name:</strong> {template.name}</p>
        <p><strong>Description:</strong> {template.description}</p>
        <p><strong>Category:</strong> {template.category}</p>
        {/* Add more template details as needed */}
      </div>
      <div className="mt-4">
        <h3 className="text-md font-medium">Audience Details</h3>
        <p><strong>Selected Audience:</strong> {audience.length} contacts</p>
        {/* Optionally list audience details */}
      </div>
      <div className="mt-6 flex space-x-4">
        <button onClick={onEdit} className="px-4 py-2 bg-blue-500 text-white rounded">Edit</button>
        <button onClick={onConfirm} className="px-4 py-2 bg-green-500 text-white rounded">Confirm Campaign</button>
      </div>
    </div>
  );
};

export default ReviewCampaign; 