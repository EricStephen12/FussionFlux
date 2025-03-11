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
  UsersIcon,
} from '@heroicons/react/24/outline';
import { apolloService } from '@/services/apollo';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';
import { useResend } from '@/hooks/useResend';
import { useSubscription } from '@/hooks/useSubscription';
import AudienceSelector from '@/components/campaigns/AudienceSelector';

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
  const { sendEmail } = useResend();
  const { subscription } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [audienceUnlocked, setAudienceUnlocked] = useState(true);

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
      
      // Sort campaigns by date
      const sortedCampaigns = campaignsData.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      
      // Sort templates by last modified date
      const sortedTemplates = templatesData.sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );

      setTemplates(sortedTemplates);
      setCampaigns(sortedCampaigns);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    const templateToDuplicate = templates.find(t => t.id === templateId);
    if (templateToDuplicate) {
      try {
        await apolloService.saveTemplate({...templateToDuplicate, id: undefined}); // Create a new template
        loadData(); // Reload templates after duplication
      } catch (error) {
        console.error('Error duplicating template:', error);
      }
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

    const contact = {
      id: 'test-contact', // Placeholder ID
      firstName: 'Test', // Placeholder first name
      lastName: 'User', // Placeholder last name
      email: testEmailAddress,
      title: '',
      company: '',
      industry: '',
      location: '',
      enriched: false,
    };

    try {
      setSendingTestEmail(true);
      await sendEmail({
        to: testEmailAddress,
        subject: template.name,
        template: template,
        contact: contact,
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

  const handleAudienceSelect = (selectedCount: number, selectedContacts: any[]) => {
    console.log(`Selected audience count: ${selectedCount}`);
    // Logic to update state or perform actions with selected contacts can be added here
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const loadTemplates = async () => {
    try {
      const templatesData = await apolloService.getTemplates();
      if (Array.isArray(templatesData)) {
        setTemplates(templatesData);
      } else {
        console.error('Expected an array of templates, but received:', templatesData);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

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
      <div className="space-y-4">
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

        {/* Subscription Limits */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Email Credits</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {subscription?.maxEmails.toLocaleString()} available
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Contact Limit</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {subscription?.maxContacts.toLocaleString()} contacts
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">SMS Credits</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {subscription?.maxSMS.toLocaleString()} available
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaigns Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Active Campaigns</h2>
        <div className="space-y-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="p-6 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {campaign.status === 'scheduled' 
                      ? `Scheduled for ${new Date(campaign.startDate).toLocaleString()}`
                      : `Started ${new Date(campaign.startDate).toLocaleString()}`
                    }
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{campaign.sent}</div>
                  <div className="text-sm text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{campaign.opened}</div>
                  <div className="text-sm text-gray-500">Opened</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{campaign.clicked}</div>
                  <div className="text-sm text-gray-500">Clicked</div>
                </div>
              </div>

              <CampaignAnalytics campaignId={campaign.id} />

              <div className="mt-4 flex justify-end space-x-4">
                <Link
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active campaigns</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/campaigns/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Campaign
                </Link>
              </div>
            </div>
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
            href="/dashboard/templates/edit/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Link>
        </div>
        <div className="space-y-4">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <div key={template.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-md font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
                <div className="mt-2 flex justify-end space-x-4">
                  <button
                    onClick={() => handleDuplicateTemplate(template.id)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleSendTest(template)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates available</h3>
              <p className="mt-1 text-sm text-gray-500">Create a new template to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignsPage;