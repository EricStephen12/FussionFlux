'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { ApolloService } from '@/services/apollo';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';
import { useResend } from '@/hooks/useResend';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  lastModified: string;
  blocks: any[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  sent: number;
  opened: number;
  clicked: number;
  startDate: string;
}

function CampaignsPage() {
  const apolloService = new ApolloService();
  const { sendEmail } = useResend();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, campaignsData] = await Promise.all([
        apolloService.getTemplates(),
        apolloService.getActiveCampaigns()
      ]);
      setTemplates(templatesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await apolloService.duplicateTemplate(templateId);
      loadData(); // Reload templates after duplication
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await apolloService.deleteTemplate(templateId);
      loadData(); // Reload templates after deletion
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleSendTest = async (template: Template) => {
    if (!testEmailAddress) {
      alert('Please enter a test email address');
      return;
    }

    try {
      setSendingTestEmail(true);
      await sendEmail({
        to: testEmailAddress,
        subject: template.name,
        template: template,
      });
      alert('Test email sent successfully!');
      setTestEmailAddress('');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email. Please try again.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Create Campaign Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Email Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your email campaigns
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Campaign
        </Link>
      </div>

      {/* Active Campaigns Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Active Campaigns</h2>
        <div className="space-y-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="p-4 bg-white rounded shadow">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <CampaignAnalytics campaignId={campaign.id} />
            </div>
          ))}
          {campaigns.length === 0 && (
            <p className="text-center text-gray-500">No active campaigns</p>
          )}
        </div>
      </div>

      {/* Email Templates Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Email Templates</h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory === 'All'
                ? 'All available templates'
                : `${selectedCategory} templates`}
            </p>
          </div>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border-gray-300"
            />
          </div>
          <div className="flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border-gray-300"
            >
              <option value="All">All Categories</option>
              {Array.from(new Set(templates.map(t => t.category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.category}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  template.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.status}
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}

              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="Test email address"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 text-sm"
                  />
                  <button
                    onClick={() => handleSendTest(template)}
                    disabled={sendingTestEmail || !testEmailAddress}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Test
                  </button>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleDuplicateTemplate(template.id)}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Duplicate template"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </button>
                  <Link
                    href={`/dashboard/templates/edit/${template.id}`}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Edit template"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete template"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CampaignsPage;