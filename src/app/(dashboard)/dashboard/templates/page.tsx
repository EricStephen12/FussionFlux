'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useSubscription } from '@/hooks/useSubscription';

// Template categories based on subscription tiers
const templateTiers = {
  free: ['Welcome Series', 'Basic Promotional'],
  starter: ['Welcome Series', 'Basic Promotional', 'Abandoned Cart', 'Order Confirmation'],
  growth: ['Welcome Series', 'Advanced Promotional', 'Abandoned Cart', 'Order Confirmation', 'Customer Feedback', 'Re-engagement'],
  pro: ['Welcome Series', 'Advanced Promotional', 'Abandoned Cart', 'Order Confirmation', 'Customer Feedback', 'Re-engagement', 'VIP Customer', 'Custom Templates']
};

// This would typically come from your backend
const sampleTemplates = [
  {
    id: '1',
    name: 'Welcome Series - First Email',
    category: 'Welcome Series',
    tier: 'free',
    description: 'First email in the welcome series for new subscribers',
    status: 'active',
    performance: { openRate: 45, clickRate: 12 },
    lastModified: '2024-03-15',
    thumbnail: '/templates/welcome-1.png',
  },
  {
    id: '2',
    name: 'Abandoned Cart Recovery',
    category: 'Abandoned Cart',
    tier: 'starter',
    description: 'Reminder email for customers who left items in their cart',
    status: 'active',
    performance: { openRate: 38, clickRate: 15 },
    lastModified: '2024-03-14',
    thumbnail: '/templates/cart-recovery.png',
  },
  {
    id: '3',
    name: 'VIP Customer Appreciation',
    category: 'VIP Customer',
    tier: 'pro',
    description: 'Exclusive offers for VIP customers',
    status: 'active',
    performance: { openRate: 52, clickRate: 18 },
    lastModified: '2024-03-13',
    thumbnail: '/templates/vip-customer.png',
  },
  // Add more sample templates as needed
];

export default function TemplatesPage() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filter templates based on subscription tier
  const accessibleTemplates = sampleTemplates.filter(template => {
    if (!subscription) return template.tier === 'free';
    
    switch (subscription.tier) {
      case 'pro':
        return true; // Pro users can access all templates
      case 'growth':
        return template.tier !== 'pro';
      case 'starter':
        return template.tier === 'free' || template.tier === 'starter';
      default:
        return template.tier === 'free';
    }
  });

  // Filter templates based on search and category
  const filteredTemplates = accessibleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get available categories based on subscription tier
  const availableCategories = subscription ? templateTiers[subscription.tier] : templateTiers.free;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Email Templates</h1>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </Link>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Manage your email templates and track their performance
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search templates"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    <button
                      onClick={() => router.push(`/dashboard/templates/edit/${template.id}`)}
                      className="hover:text-indigo-600"
                    >
                      {template.name}
                    </button>
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{template.description}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {template.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>Category: {template.category}</div>
                  <div>Modified: {template.lastModified}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Open Rate:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {template.performance.openRate}%
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Click Rate:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {template.performance.clickRate}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/templates/edit/${template.id}`)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 