export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  lastModified: string;
  blocks: any[];
}

// Simulated function to fetch saved templates
export const fetchSavedTemplates = async (): Promise<Template[]> => {
  // Simulated data
  return [
    { id: '1', name: 'Template 1', category: 'Category 1', description: 'Description 1', status: 'draft', lastModified: '2023-01-01', blocks: [] },
    { id: '2', name: 'Template 2', category: 'Category 2', description: 'Description 2', status: 'published', lastModified: '2023-01-02', blocks: [] },
    { id: '3', name: 'Template 3', category: 'Category 3', description: 'Description 3', status: 'draft', lastModified: '2023-01-03', blocks: [] }
  ];
};

// Function to save a template
export const saveTemplate = async (template: Template): Promise<void> => {
  // Simulated API call to save the template
  console.log('Saving template:', template);
  // Here you would typically make an API call to save the template
  // For example: await axios.post('/api/templates', template);
}; 