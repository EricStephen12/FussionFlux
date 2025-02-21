'use client';

import { useRouter } from 'next/navigation';
import TemplateEditor from '@/components/campaigns/TemplateEditor';

export default function NewTemplatePage() {
  const router = useRouter();

  const initialTemplate = {
    id: '',
    name: 'Untitled Template',
    category: 'newsletter',
    blocks: [],
  };

  return (
    <TemplateEditor
      template={initialTemplate}
      onSave={async (template) => {
        // Here you would typically save the template to your backend
        console.log('Saving new template:', template);
        router.push('/dashboard/campaigns');
      }}
      onCancel={() => router.back()}
    />
  );
} 