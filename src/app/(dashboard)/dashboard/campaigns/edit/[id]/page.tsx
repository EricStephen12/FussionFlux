'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateEditor from '@/components/campaigns/TemplateEditor';
import { presetTemplates } from '@/components/campaigns/presetTemplates';
import LoadingSpinner from '@/components/LoadingSpinner';

// This would typically come from your backend
const getTemplateById = async (id) => {
  try {
    // First try to get from localStorage
    const storedTemplate = localStorage.getItem('editingTemplate');
    if (storedTemplate) {
      const template = JSON.parse(storedTemplate);
      localStorage.removeItem('editingTemplate'); // Clear after loading
      return {
        ...template,
        lastModified: template.lastModified || new Date().toISOString()
      };
    }

    // If not in localStorage, check if it's a preset template
    const presetId = id.toLowerCase().replace(/\s+/g, '-');
    
    // First, try exact match
    if (presetTemplates[id]) {
      const preset = presetTemplates[id];
      return {
        id,
        name: preset.name,
        category: id,
        description: `Professional ${id.toLowerCase()} email template`,
        status: 'draft',
        blocks: preset.blocks.map(block => ({
          ...block,
          id: crypto.randomUUID(),
          type: block.type
        })),
        isPreset: true,
        lastModified: new Date().toISOString()
      };
    }

    // Then try normalized version
    const presetCategory = Object.keys(presetTemplates).find(
      category => category.toLowerCase().replace(/\s+/g, '-') === presetId
    );
    
    if (presetCategory && presetTemplates[presetCategory]) {
      const preset = presetTemplates[presetCategory];
      return {
        id,
        name: preset.name,
        category: presetCategory,
        description: `Professional ${presetCategory.toLowerCase()} email template`,
        status: 'draft',
        blocks: preset.blocks.map(block => ({
          ...block,
          id: crypto.randomUUID(),
          type: block.type
        })),
        isPreset: true,
        lastModified: new Date().toISOString()
      };
    }

    // If not found anywhere, return a basic template
    return {
      id,
      name: 'New Template',
      category: 'Custom',
      description: 'Start from scratch',
      status: 'draft',
      blocks: [],
      lastModified: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error loading template:', error);
    throw new Error('Failed to load template');
  }
};

export default function EditTemplatePage({ params }) {
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTemplateById(params.id);
        setTemplate(data);
      } catch (error) {
        console.error('Error loading template:', error);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Template not found</h2>
          <p className="mt-2 text-gray-600">The template you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <TemplateEditor
      template={template}
      onSave={async (updatedTemplate) => {
        try {
          // Here you would typically save the template to your backend
          console.log('Saving template:', updatedTemplate);
          router.push('/dashboard/campaigns');
        } catch (error) {
          console.error('Error saving template:', error);
          setError('Failed to save template');
        }
      }}
      onCancel={() => router.back()}
    />
  );
} 