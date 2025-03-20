'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { presetTemplates } from './presetTemplates';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { classNames } from '@/lib/utils';
import { apolloService } from '@/services/apollo';
import Image from 'next/image';

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

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onCreateNew: () => void;
  onEdit: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

export default function TemplateSelector({
  onSelect,
  onCreateNew,
  onEdit,
  onDelete,
}: TemplateSelectorProps) {
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
      // Load both preset and user templates with proper error handling
      const [presetResponse, userResponse] = await Promise.all([
        apolloService.getPresetTemplates().catch(err => {
          console.error('Error fetching preset templates:', err);
          return [];
        }),
        apolloService.getUserTemplates().catch(err => {
          console.error('Error fetching user templates:', err);
          return [];
        })
      ]);

      // Ensure we have arrays even if the responses are undefined
      const presetTemplates = Array.isArray(presetResponse) ? presetResponse : [];
      const userTemplates = Array.isArray(userResponse) ? userResponse : [];

      // Format templates with null checks
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
        }))
      ];

      setTemplates(formattedTemplates);
      
      // Get unique categories with null checks
      const uniqueCategories = new Set(['All', ...formattedTemplates.map(t => t.category || 'General')]);
      setCategories(Array.from(uniqueCategories));
    } catch (error: any) {
      console.error('Error loading templates:', error);
      setError(error?.message || 'Failed to load templates');
      // Set empty arrays as fallback
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

  const handleEdit = (template: Template) => {
    const userTier = getUserSubscriptionTier(); // Ensure user tier is retrieved correctly
    if (userTier !== 'premium') {
        alert('This action is only available for premium users. Please upgrade to access this feature.');
        return;
    }
    onEdit(template);
  };

  const handleDelete = (templateId: string) => {
    const userTier = getUserSubscriptionTier(); // Ensure user tier is retrieved correctly
    if (userTier !== 'premium') {
        alert('This action is only available for premium users. Please upgrade to access this feature.');
        return;
    }
    onDelete(templateId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
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
            className="relative group bg-white p-4 sm:p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {template.description}
                </p>
              </div>
              <Menu as="div" className="relative ml-3 flex-shrink-0">
                <Menu.Button className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                  <span className="sr-only">Open options</span>
                  <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleEdit(template)}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left'
                          )}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleDelete(template.id)}
                          className={classNames(
                            active ? 'bg-gray-50' : '',
                            'block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left text-red-600'
                          )}
                        >
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            {template.thumbnail && (
              <div className="mt-4 aspect-[4/3] relative overflow-hidden rounded-lg">
                <Image
                  src={template.thumbnail}
                  alt={template.name}
                  width={400}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => onSelect(template)}
                className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}

        {/* Create New Template Card */}
        <div
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-4 sm:p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
          onClick={onCreateNew}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <PlusIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-900">
              Create New Template
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 