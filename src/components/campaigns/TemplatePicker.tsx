'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { apolloService } from '@/services/apollo';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { presetTemplates } from './presetTemplates';
import { useRouter } from 'next/navigation';
import { fetchSavedTemplates } from '@/services/api';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'active';
  performance?: string;
  lastModified: string;
  thumbnail: string;
  blocks: any[];
}

interface TemplatePickerProps {
  onSelect: (templateId: string) => void;
  selected: string | null;
  onNext: () => void;
}

export default function TemplatePicker({
  onSelect,
  selected,
  onNext,
}: TemplatePickerProps) {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load templates from multiple sources with robust error handling
      let presetResponse = [];
      let userResponse = [];
      let savedTemplatesResponse = [];
      
      try {
        presetResponse = await apolloService.getPresetTemplates();
      } catch (err) {
        console.error('Error fetching preset templates:', err);
        // Show error but continue loading other template sources
      }
      
      try {
        userResponse = await apolloService.getUserTemplates();
      } catch (err) {
        console.error('Error fetching user templates:', err);
        // Continue with other template sources
      }
      
      try {
        savedTemplatesResponse = await fetchSavedTemplates();
      } catch (err) {
        console.error('Error fetching saved templates:', err);
        // Continue with other template sources
      }

      // Ensure we have arrays even if the responses are undefined
      const presetTemplates = Array.isArray(presetResponse) ? presetResponse : [];
      const userTemplates = Array.isArray(userResponse) ? userResponse : [];
      const savedTemplates = Array.isArray(savedTemplatesResponse) ? savedTemplatesResponse : [];

      // Use mock templates if all fetches failed
      if (presetTemplates.length === 0 && userTemplates.length === 0 && savedTemplates.length === 0) {
        console.log('No templates found, showing mock templates');
        
        // Generate mock templates
        const mockTemplates = [
          {
            id: 'mock-1',
            name: 'Welcome Email',
            category: 'Onboarding',
            description: 'A friendly welcome email for new subscribers',
            status: 'active',
            lastModified: new Date().toISOString(),
            thumbnail: 'https://source.unsplash.com/random/300x400?email',
            blocks: []
          },
          {
            id: 'mock-2',
            name: 'Product Announcement',
            category: 'Marketing',
            description: 'Announce your latest product or feature',
            status: 'active',
            lastModified: new Date().toISOString(),
            thumbnail: 'https://source.unsplash.com/random/300x400?marketing',
            blocks: []
          },
          {
            id: 'mock-3',
            name: 'Abandoned Cart',
            category: 'E-commerce',
            description: 'Remind customers about items left in their cart',
            status: 'active',
            lastModified: new Date().toISOString(),
            thumbnail: 'https://source.unsplash.com/random/300x400?shopping',
            blocks: []
          }
        ];
        
        setTemplates(mockTemplates);
        setCategories(['All', 'Onboarding', 'Marketing', 'E-commerce']);
        return;
      }

      // Format templates with null checks and combine all sources
      const formattedTemplates = [
        ...presetTemplates.map(template => ({
          id: template?.id || `preset-${Date.now()}`,
          name: template?.name || 'Untitled Template',
          category: template?.category || 'General',
          description: template?.description || `Professional ${template?.category || 'email'} template`,
          status: template?.status || 'active',
          performance: template?.stats?.openRate ? `${template.stats.openRate}%` : undefined,
          lastModified: template?.updatedAt || new Date().toISOString(),
          thumbnail: template?.thumbnail || `https://source.unsplash.com/random/300x400?${template?.category || 'email'}`,
          blocks: template?.blocks || []
        })),
        ...userTemplates.map(template => ({
          id: template?.id || `user-${Date.now()}`,
          name: template?.name || 'Custom Template',
          category: template?.category || 'Custom',
          description: template?.description || 'Custom email template',
          status: template?.status || 'draft',
          performance: template?.stats?.openRate ? `${template.stats.openRate}%` : undefined,
          lastModified: template?.updatedAt || new Date().toISOString(),
          thumbnail: template?.thumbnail || `https://source.unsplash.com/random/300x400?email`,
          blocks: template?.blocks || []
        })),
        ...savedTemplates.map(template => ({
          id: template?.id || `saved-${Date.now()}`,
          name: template?.name || 'Saved Template',
          category: template?.category || 'Custom',
          description: template?.description || 'Saved email template',
          status: template?.status || 'draft',
          performance: undefined,
          lastModified: template?.lastModified || new Date().toISOString(),
          thumbnail: template?.thumbnail || `https://source.unsplash.com/random/300x400?email`,
          blocks: template?.blocks || []
        }))
      ];

      setTemplates(formattedTemplates);
      
      // Extract unique categories for the filter dropdown
      const categories = ['All', ...new Set(formattedTemplates.map(t => t.category))];
      setCategories(categories);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates. Please try again.');
      
      // Set fallback data
      setTemplates([]);
      setCategories(['All']);
    } finally {
      setLoading(false);
    }
  };

  const [categories, setCategories] = useState(['All']);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Choose a Template</h2>
          
          {/* Add Create New Template button */}
          <button
            onClick={() => router.push('/dashboard/campaigns/new')}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            <PlusCircleIcon className="h-4 w-4 mr-1.5" />
            Create New Template
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                selected === template.id ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                <Image
                  src={template.thumbnail}
                  alt={template.name}
                  width={300}
                  height={169}
                  className="object-cover"
                />
                {template.performance && (
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    {template.performance} opens
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{template.description}</p>
              </div>
              {selected === template.id && (
                <div className="absolute inset-0 bg-indigo-500 bg-opacity-10 flex items-center justify-center">
                  <div className="bg-white rounded-full p-2 shadow-md">
                    <SparklesIcon className="h-6 w-6 text-indigo-500" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selected}
          className={`flex items-center px-4 py-2 rounded-md text-white ${
            selected ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next Step
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 