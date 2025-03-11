'use client';

import { useRouter } from 'next/navigation';
import TemplateEditor from '@/components/campaigns/TemplateEditor';
import { Template } from '@/types/template';

export default function NewTemplatePage() {
  const router = useRouter();
  
  const initialTemplate: Template = {
    id: crypto.randomUUID(),
    name: 'New Template',
    category: 'Custom',
    description: 'Start from scratch',
    status: 'draft',
    blocks: [],
    lastModified: new Date().toISOString()
  };

  return (
    <TemplateEditor
      template={initialTemplate}
      onSave={async (template) => {
        // Here you would typically save the template to your backend
        console.log('Saving new template:', template);
        router.push('/dashboard/templates');
      }}
      onCancel={() => router.back()}
    />
  );
} 