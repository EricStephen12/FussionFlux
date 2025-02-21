'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateEditor from '@/components/campaigns/TemplateEditor';
import { presetTemplates } from '@/components/campaigns/TemplateEditor';

// This would typically come from your backend
const getTemplateById = async (id: string) => {
  // First try to get from localStorage
  const storedTemplate = localStorage.getItem('editingTemplate');
  if (storedTemplate) {
    const template = JSON.parse(storedTemplate);
    localStorage.removeItem('editingTemplate'); // Clear after loading
    return template;
  }

  // If not in localStorage, check if it's a preset template
  const presetId = id.toLowerCase().replace(/\s+/g, '-');
  const presetCategory = Object.keys(presetTemplates).find(
    category => category.toLowerCase().replace(/\s+/g, '-') === presetId
  );
  
  if (presetCategory) {
    const preset = presetTemplates[presetCategory];
    return {
      id,
      name: preset.name,
      category: presetCategory,
      description: `Professional ${presetCategory.toLowerCase()} email template`,
      status: 'draft' as const,
      blocks: preset.blocks.map(block => ({
        ...block,
        id: crypto.randomUUID() // Generate new IDs for the blocks
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
    status: 'draft' as const,
    blocks: [],
    lastModified: new Date().toISOString()
  };
};

export default function EditTemplatePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await getTemplateById(params.id);
        setTemplate(data);
      } catch (error) {
        console.error('Error loading template:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Template not found</h2>
          <p className="mt-2 text-gray-600">The template you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <TemplateEditor
      template={template}
      onSave={async (updatedTemplate) => {
        // Here you would typically save the template to your backend
        console.log('Saving template:', updatedTemplate);
        router.push('/dashboard/templates');
      }}
      onCancel={() => router.back()}
    />
  );
} 