'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import TemplateEditor from '@/components/campaigns/TemplateEditor';
import { nanoid } from 'nanoid';
import { firestoreService } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function NewTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Create a blank template for the editor
  const blankTemplate = {
    id: nanoid(),
    name: 'New Template',
    category: 'Custom',
    description: 'My custom template',
    status: 'draft',
    blocks: [],
    lastModified: new Date().toISOString(),
    userId: user?.uid
  };

  const handleSaveTemplate = async (template) => {
    if (!user) {
      toast.error('You must be logged in to save templates');
      return;
    }
    
    try {
      setLoading(true);
      
      // Import the template service dynamically to avoid SSR issues
      const { templateService } = await import('@/services/templateService');
      
      // Create or update the template
      if (template.id && template.id !== blankTemplate.id) {
        // Update existing template
        const result = await templateService.update(template.id, {
          ...template,
          lastModified: new Date().toISOString(),
          userId: user.uid
        });
        
        if (result.success) {
          toast.success('Template updated successfully');
        } else {
          toast.error(result.error || 'Failed to update template');
        }
      } else {
        // Create new template
        const result = await templateService.create({
          ...template,
          id: nanoid(),
          lastModified: new Date().toISOString(),
          userId: user.uid
        });
        
        if (result.success) {
          toast.success('Template created successfully');
          // Navigate back to campaigns page
          router.push('/dashboard/campaigns');
        } else {
          toast.error(result.error || 'Failed to create template');
        }
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('An unexpected error occurred when saving the template');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <TemplateEditor
          template={blankTemplate}
          onSave={handleSaveTemplate}
          onPreview={() => console.log('Preview not implemented yet')}
          readOnly={false}
        />
      </div>
    </div>
  );
} 