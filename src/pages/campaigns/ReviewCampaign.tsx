import React from 'react';
import { useRouter } from 'next/router';
import { Template } from '../../services/api';

interface ReviewCampaignProps {
  template?: Template;
  audience?: any[];
  onConfirm: () => void;
  onEdit: () => void;
}

const ReviewCampaign: React.FC<ReviewCampaignProps> = ({ 
  template, 
  audience = [], 
  onConfirm, 
  onEdit 
}) => {
  const router = useRouter();

  // Early return for loading state if we're waiting for template data
  if (typeof template === 'undefined') {
    return (
      <div className="p-4 bg-white rounded shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state if template is null
  if (!template) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="mt-2">No template data available. Please select a template first.</p>
        <button 
          onClick={() => router.push('/templates')} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Select Template
        </button>
      </div>
    );
  }

  const hasAudience = Array.isArray(audience) && audience.length > 0;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Review Your Campaign</h2>
      
      <div className="mt-4">
        <h3 className="text-md font-medium">Template Details</h3>
        <div className="mt-2 space-y-2">
          <p><strong>Name:</strong> {template.name || 'Untitled Template'}</p>
          <p><strong>Description:</strong> {template.description || 'No description provided'}</p>
          <p><strong>Category:</strong> {template.category || 'Uncategorized'}</p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-md font-medium">Audience Details</h3>
        <div className="mt-2">
          <p><strong>Selected Audience:</strong> {hasAudience ? `${audience.length} contacts` : 'No contacts selected'}</p>
          {!hasAudience && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700">
                Warning: No audience selected. Please select your target audience before proceeding.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button 
          onClick={onEdit} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Edit Campaign
        </button>
        <button 
          onClick={onConfirm}
          disabled={!hasAudience}
          className={`px-4 py-2 rounded transition-colors ${
            !hasAudience 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          Confirm Campaign
        </button>
      </div>
    </div>
  );
};

export default ReviewCampaign; 