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
  PauseIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';
import { useResend } from '@/hooks/useResend';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import AudienceSelector from '@/components/campaigns/AudienceSelector';
import CampaignStatusBadge from '@/components/campaigns/CampaignStatusBadge';
import CampaignPerformance from '@/components/campaigns/CampaignPerformance';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestoreService } from '@/services/firestore';
import { CreditService } from '@/services/creditService';

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

export default function CampaignsClient() {
  const { sendEmail } = useResend();
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [audienceUnlocked, setAudienceUnlocked] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  const [creditInfo, setCreditInfo] = useState({
    available: {
      emails: 0,
      sms: 0,
      leads: 0
    },
    loading: true
  });

  useEffect(() => {
    if (user) {
    loadData();
      subscribeToRealTimeUpdates();
      fetchCreditInfo();
    }
  }, [user]);

  const subscribeToRealTimeUpdates = () => {
    if (!user) return;
    
    try {
      const campaignsRef = collection(firestoreService.db, 'campaigns');
      const q = query(campaignsRef, where('userId', '==', user.uid));
      
      return onSnapshot(q, (snapshot) => {
        const campaignData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Campaign[];
        
        // Sort campaigns by date
        const sortedCampaigns = campaignData.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        setCampaigns(sortedCampaigns);
        setLoading(false);
      }, (error) => {
        console.error('Error in campaign subscription:', error);
        toast.error('Failed to get real-time campaign updates');
        setLoading(false);
      });
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch templates from API endpoints
      const templatesResponse = await fetch('/api/templates');
      
      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch template data');
      }
      
      const templatesData = await templatesResponse.json();
      
      // Sort templates by last modified date
      const sortedTemplates = templatesData.sort((a: Template, b: Template) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );

      setTemplates(sortedTemplates);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load templates');
    }
  };

  const fetchCreditInfo = async () => {
    try {
      setCreditInfo(prev => ({ ...prev, loading: true }));
      const availableCredits = await CreditService.getAvailableCredits(user.uid);
      setCreditInfo({
        available: availableCredits,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching credit info:', error);
      setCreditInfo(prev => ({ ...prev, loading: false }));
    }
  };

  // Campaign control functions
  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const campaignRef = doc(firestoreService.db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'paused',
        pausedAt: new Date().toISOString()
      });
      toast.success('Campaign paused successfully');
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast.error('Failed to pause campaign');
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const campaignRef = doc(firestoreService.db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'sending',
        resumedAt: new Date().toISOString()
      });
      toast.success('Campaign resumed successfully');
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast.error('Failed to resume campaign');
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to stop this campaign? This action cannot be undone.')) {
      return;
    }
    
    try {
      const campaignRef = doc(firestoreService.db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'stopped',
        stoppedAt: new Date().toISOString()
      });
      toast.success('Campaign stopped successfully');
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast.error('Failed to stop campaign');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    const templateToDuplicate = templates.find(t => t.id === templateId);
    if (templateToDuplicate) {
      try {
        const response = await fetch('/api/templates/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ templateId }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to duplicate template');
        }
        
        loadData(); // Reload templates after duplication
      } catch (error) {
        console.error('Error duplicating template:', error);
      }
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
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

  const CampaignActions = ({ campaign }: { campaign: Campaign }) => {
    return (
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          <span>Actions</span>
          <ChevronDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
        </Menu.Button>
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href={`/dashboard/campaigns/edit/${campaign.id}`}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400" />
                  Edit Campaign
                </Link>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <ChartBarIcon className="mr-3 h-5 w-5 text-gray-400" />
                  View Analytics
                </button>
              )}
            </Menu.Item>
            
            {campaign.status === 'sending' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handlePauseCampaign(campaign.id)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <PauseIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Pause Campaign
                  </button>
                )}
              </Menu.Item>
            )}
            
            {campaign.status === 'paused' && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleResumeCampaign(campaign.id)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex w-full items-center px-4 py-2 text-sm`}
                  >
                    <PlayIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Resume Campaign
                  </button>
                )}
              </Menu.Item>
            )}
            
            {(campaign.status === 'sending' || campaign.status === 'paused' || campaign.status === 'scheduled') && (
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleStopCampaign(campaign.id)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex w-full items-center px-4 py-2 text-sm text-red-600`}
                  >
                    <StopIcon className="mr-3 h-5 w-5 text-red-500" />
                    Stop Campaign
                  </button>
                )}
              </Menu.Item>
            )}
          </div>
        </Menu.Items>
      </Menu>
    );
  };

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

  // Render campaign analytics if a campaign is selected
  if (selectedCampaign && viewMode === 'analytics') {
    const campaign = campaigns.find(c => c.id === selectedCampaign);
    if (!campaign) return null;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{campaign.name} Analytics</h2>
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setViewMode('list');
            }}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Campaigns
          </button>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <CampaignPerformance campaigns={[campaign]} />
          </div>
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
          <div className="flex space-x-3">
            <button 
              onClick={() => loadData()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Campaign
          </Link>
          </div>
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

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Campaign
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Sent
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Open Rate
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Click Rate
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {campaign.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <CampaignStatusBadge status={campaign.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {campaign.sent.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {campaign.opened ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {campaign.clicked ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <CampaignActions campaign={campaign} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No campaigns yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first campaign.
          </p>
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
            href="/dashboard/campaigns/new-template"
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