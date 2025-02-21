'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { presetTemplates } from './TemplateEditor';

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
  onDuplicate: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

// Update the categories array to match our preset templates
const categories = [
  'All',
  ...Object.keys(presetTemplates)
];

// Convert preset templates to the format expected by TemplateSelector
const presetTemplatesList = Object.entries(presetTemplates).map(([category, template]) => ({
  id: category.toLowerCase().replace(/\s+/g, '-'),
  name: template.name,
  category,
  description: `Professional ${category.toLowerCase()} email template`,
  status: 'active' as const,
  performance: '95%',
  lastModified: new Date().toISOString(),
  thumbnail: `https://source.unsplash.com/random/300x400?${category.toLowerCase().replace(/\s+/g, '-')}`,
  blocks: template.blocks
}));

export default function TemplateSelector({
  onSelect,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = presetTemplatesList.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
                  onClick={() => onDuplicate(template)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Duplicate template"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onEdit(template)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Edit template"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(template.id)}
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