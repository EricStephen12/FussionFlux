'use client';

import { useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApolloService } from '../../services/apollo';
import { presetTemplates } from './TemplateEditor';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  performance?: number;
  lastModified: string;
  thumbnail?: string;
  blocks: any[];
  isPreset?: boolean;
}

interface TemplateGridProps {
  templates: Template[];
  categories: string[];
  onDuplicate: (templateId: string) => Promise<void>;
  onDelete: (templateId: string) => Promise<void>;
  showPresets?: boolean;
  onSelect: (template: Template) => void;
  onCreateNew: () => void;
  onEdit: (template: Template) => void;
}

// Convert preset templates to the format expected by TemplateGrid
const presetTemplatesList = Object.entries(presetTemplates).map(([category, template]) => ({
  id: category.toLowerCase().replace(/\s+/g, '-'),
  name: template.name,
  category,
  description: `Professional ${category.toLowerCase()} email template`,
  status: 'active',
  performance: '95%',
  lastModified: new Date().toISOString(),
  thumbnail: `https://source.unsplash.com/random/300x400?${category.toLowerCase().replace(/\s+/g, '-')}`,
  blocks: template.blocks
}));

export default function TemplateGrid({
  templates,
  categories,
  onDuplicate,
  onDelete,
  showPresets = false,
  onSelect,
  onCreateNew,
  onEdit,
}: TemplateGridProps) {
  const router = useRouter();
  const apolloService = new ApolloService();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = showPresets ? template.isPreset : !template.isPreset;
    return matchesCategory && matchesSearch && matchesType;
  });

  const handleEdit = async (templateId: string) => {
    setIsLoading(true);
    try {
      const template = await apolloService.getTemplate(templateId);
      if (template) {
        // Store the template in localStorage to persist it during navigation
        localStorage.setItem('editingTemplate', JSON.stringify(template));
        router.push(`/dashboard/campaigns/edit/${templateId}`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (templateId: string) => {
    setIsLoading(true);
    try {
      await onDuplicate(templateId);
    } catch (error) {
      console.error('Error duplicating template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(templateId);
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {showPresets ? 'Preset Templates' : 'My Templates'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedCategory === 'All'
              ? 'All available templates'
              : `${selectedCategory} templates`}
          </p>
        </div>
        {!showPresets && (
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Link>
        )}
      </div>

      {/* Search and Filters */}
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
            <option value="All">All Categories</option>
            {Object.keys(presetTemplates).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* New Template Card */}
        <div
          onClick={onCreateNew}
          className="relative group cursor-pointer bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors p-6 flex flex-col items-center justify-center"
        >
          <PlusIcon className="h-12 w-12 text-gray-400 group-hover:text-indigo-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Create new template</h3>
          <p className="mt-1 text-sm text-gray-500">Start from scratch</p>
        </div>

        {/* Template Cards */}
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="relative group bg-white rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors"
          >
            {/* Template Preview */}
            <div className="aspect-w-16 aspect-h-9 rounded-t-lg overflow-hidden bg-gray-100">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="object-cover transform group-hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Template Info */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {template.category}
                </span>
                {template.performance && (
                  <span className="text-sm text-green-600">{template.performance}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleDuplicate(template.id)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Duplicate template"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEdit(template.id)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Edit template"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Delete template"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Use Template Button */}
              <button
                onClick={() => onSelect(template)}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 