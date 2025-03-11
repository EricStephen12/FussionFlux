'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ChartPieIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { creditsService } from '../../services/trial';
import LoadingSpinner from '../LoadingSpinner';
import { apolloService } from '@/services/apollo';
import { fetchScoredLeads } from '../../services/apollo';
import { useAuth } from '@/contexts/AuthContext'; // Importing the authentication context

interface AudienceSelectorProps {
  onSelect: (selectedCount: number, contacts: any[]) => void;
  initialCount?: number;
}

const ALL_NICHES = [
  // E-commerce
  'Fashion & Apparel',
  'Beauty & Cosmetics',
  'Home & Garden',
  'Electronics',
  'Sports & Fitness',
  
  // SaaS
  'Marketing Tools',
  'Project Management',
  'Analytics & BI',
  'CRM & Sales',
  'HR & Recruitment',
  
  // Digital Agency
  'Web Development',
  'Digital Marketing',
  'Branding & Design',
  'SEO Services',
  'Social Media',
  
  // Retail
  'Luxury Goods',
  'Health & Wellness',
  'Food & Beverage',
  'Pet Supplies',
  'Books & Media',
  
  // B2B Services
  'IT Services',
  'Business Consulting',
  'Financial Services',
  'Legal Services',
  'Training & Development'
];

export default function AudienceSelector({
  onSelect,
  initialCount = 100,
}: AudienceSelectorProps) {
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading, getMaxContacts, subscriptionTiers = {} } = useSubscription();
  const { user } = useAuth(); // Accessing the current user
  const userId = user?.uid; // Ensure this is a valid string
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId:', userId);
    return; // Prevent further execution if userId is invalid
  }
  const [selectedCount, setSelectedCount] = useState<number>(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importedContacts, setImportedContacts] = useState<any[]>([]);
  const [step, setStep] = useState<'select' | 'review'>('select');
  const [previewLeads, setPreviewLeads] = useState<any[]>([]);
  const [totalLeadsAvailable, setTotalLeadsAvailable] = useState<number>(0);
  const [selectedSource, setSelectedSource] = useState<'discover' | 'import' | 'retargeting' | 'lookalike'>('discover');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [trialStatus, setTrialStatus] = useState<{
    isActive: boolean;
    remainingLeads: number;
    message: string;
  }>({ isActive: false, remainingLeads: 0, message: '' });
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: ''
  });
  const [manualContacts, setManualContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [retargetingLeads, setRetargetingLeads] = useState<any[]>([]);
  const [lookalikeLeads, setLookalikeLeads] = useState<any[]>([]);
  const [availableCredits, setAvailableCredits] = useState({
    base: 0,
    extra: 0
  });

  console.log('AudienceSelector component rendered');
  console.log('Subscription data:', subscription);
  console.log('User ID:', userId);

  const loadTrialStatus = async () => {
    if (!subscriptionLoading && !subscription) {
      try {
        if (userId) {
          const trialEligibility = await creditsService.checkTrialEligibility(userId);
          
          if (trialEligibility) {
            setTrialStatus({
              isActive: trialEligibility.canUse,
              remainingLeads: trialEligibility.remainingPreviews,
              message: trialEligibility.message
            });
            
            // If trial is active, set initial count to remaining trial leads or 100, whichever is smaller
            if (trialEligibility.canUse) {
              const maxAllowed = Math.min(100, trialEligibility.remainingPreviews);
              const initialValue = Math.min(initialCount, maxAllowed);
              setSelectedCount(initialValue);
            }
          }
        } else {
          console.error('User ID is undefined');
        }
      } catch (error) {
        console.error('Error loading trial status:', error);
      }
    }
  };

  const loadAvailableCredits = async () => {
    if (!subscription?.userId) return;
    
    try {
      const baseCredits = subscription.maxContacts - (subscription.usageStats?.usedLeads || 0);
      const extraCredits = await creditsService.getAvailableExtraCredits(subscription.userId, 'leads');
      
      setAvailableCredits({
        base: baseCredits,
        extra: extraCredits
      });
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  useEffect(() => {
    loadTrialStatus();
    loadAvailableCredits();
  }, [subscription]);

  useEffect(() => {
    if (!subscriptionLoading && subscription) {
      const maxAllowed = Math.min(getMaxContacts(), subscription?.limits || 0);
      const initialValue = Math.min(initialCount, maxAllowed);
      setSelectedCount(initialValue);
      if (selectedSource === 'discover' && selectedNiche) {
        loadPreviewLeads(initialValue);
      }
    }
  }, [subscriptionLoading, subscription, initialCount, selectedSource, selectedNiche]);

  // Load preview leads on mount
  useEffect(() => {
    if (!subscriptionLoading) {
      loadPreviewLeads(10); // Load 10 preview leads for free users
    }
  }, [subscriptionLoading]);

  const loadPreviewLeads = async (count: number) => {
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId:', userId);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Check subscription tier and limits
      const isFreeTier = subscription?.tier === 'free';
      const maxPreviewLeads = isFreeTier ? 10 : subscription?.maxContacts || 0;
      const requestedCount = Math.min(count, maxPreviewLeads);

      // For free tier, only allow basic lead discovery
      if (isFreeTier && selectedSource !== 'discover') {
        setError('Free tier only supports basic lead discovery. Please upgrade for advanced features.');
        return;
      }

      // Check if user has enough credits
      const availableCredits = availableCredits.base + availableCredits.extra;
      if (requestedCount > availableCredits) {
        setError(`You only have ${availableCredits} lead credits available. Please purchase more credits or reduce the audience size.`);
        return;
      }

      const fetchedLeads = await fetchScoredLeads(requestedCount);
      
      // Update UI
      setPreviewLeads(fetchedLeads);
      setTotalLeadsAvailable(fetchedLeads.length + 90); // Show there are more leads available
      setLeads(fetchedLeads);
      onSelect(fetchedLeads.length, fetchedLeads);
    } catch (error) {
      console.error('Error loading preview leads:', error);
      setError('Failed to load preview leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check subscription tier
    const isFreeTier = subscription?.tier === 'free';
    if (isFreeTier) {
      setError('Contact import is not available in the free tier. Please upgrade to import contacts.');
      return;
    }

    if (!subscription?.features.importContacts) {
      setError('Your current plan does not include contact import. Please upgrade to access this feature.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      Papa.parse(file, {
        complete: (results: { data: any[] }) => {
          const validContacts = results.data
            .filter((row: any) => row.email && row.email.includes('@'))
            .map((row: any) => ({
              firstName: row.firstName || '',
              lastName: row.lastName || '',
              email: row.email,
              company: row.company || '',
              title: row.title || ''
            }));

          // Check against subscription limits
          if (validContacts.length > subscription.maxContacts) {
            setError(`Your plan allows importing up to ${subscription.maxContacts} contacts. Please upgrade to import more.`);
            return;
          }

          setImportedContacts(validContacts);
          onSelect(validContacts.length, validContacts);
        },
        header: true,
        error: (error: any) => {
          console.error('CSV parsing error:', error);
          setError('Failed to parse CSV file. Please check the file format.');
        }
      });
    } catch (error) {
      console.error('Error handling CSV upload:', error);
      setError('Failed to process CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (importedContacts.length > 0) {
      setStep('review');
      onSelect(importedContacts.length, importedContacts);
    } else if (previewLeads.length > 0) {
      // For free users, only allow using preview leads
      setStep('review');
      onSelect(previewLeads.length, previewLeads);
    }
  };

  const handleAddContact = () => {
    if (!newContact.firstName || !newContact.lastName || !newContact.email) {
      setError('Please fill in at least name and email fields');
      return;
    }

    // Validate email format
    if (!newContact.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Add match score and engagement level for consistency with other contact types
    const contactToAdd = {
      ...newContact,
      id: `manual-${Math.random().toString(36).substr(2, 9)}`,
      matchScore: Math.floor(Math.random() * (99 - 85) + 85),
      engagementLevel: ['High', 'Very High'][Math.floor(Math.random() * 2)],
    };

    setManualContacts([...manualContacts, contactToAdd]);
    setError(null);

    // Clear form
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      title: ''
    });

    // Auto-select the contacts
    onSelect(manualContacts.length + 1, [...manualContacts, contactToAdd]);
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = manualContacts.filter((_, i) => i !== index);
    setManualContacts(newContacts);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      updateSelectedCount(value);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const value = event.target.value;
    
    if (!value.trim()) {
      updateSelectedCount(1);
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      updateSelectedCount(numValue);
    }
  };

  const updateSelectedCount = (value: number) => {
    const totalAvailableCredits = availableCredits.base + availableCredits.extra;
    
    if (value > totalAvailableCredits) {
      setError(`You only have ${totalAvailableCredits} lead credits available. Please purchase more credits or reduce the audience size.`);
      return;
    }

    setSelectedCount(value);
    loadPreviewLeads(value);
  };

  const fetchRetargetingLeads = async () => {
    try {
        setLoading(true);
        // Example query to fetch leads that have interacted with previous campaigns
        const retargetingLeads = await apolloService.fetchRetargetingLeads(userId);
        setRetargetingLeads(retargetingLeads);
        onSelect(retargetingLeads.length, retargetingLeads);
    } catch (error) {
        console.error('Error fetching retargeting leads:', error);
        setError('Failed to load retargeting leads');
    } finally {
        setLoading(false);
    }
  };

  const fetchLookalikeLeads = async () => {
    try {
        setLoading(true);
        // Example query to fetch lookalike leads based on existing high-engagement leads
        const lookalikeLeads = await apolloService.fetchLookalikeLeads(userId);
        setLookalikeLeads(lookalikeLeads);
        onSelect(lookalikeLeads.length, lookalikeLeads);
    } catch (error) {
        console.error('Error fetching lookalike leads:', error);
        setError('Failed to load lookalike leads');
    } finally {
        setLoading(false);
    }
  };

  const handleAudienceSourceChange = async (source: 'discover' | 'import' | 'retargeting' | 'lookalike') => {
    const isFreeTier = subscription?.tier === 'free';
    const hasFullAccess = subscription?.features.fullLeadAccess || false;
    const hasImportFeature = subscription?.features.importContacts || false;

    // Clear any existing errors
    setError(null);

    // Validate source based on subscription
    if (isFreeTier && source !== 'discover') {
      setError('Free tier only supports lead discovery. Please upgrade for more features.');
      return;
    }

    if (!hasFullAccess && (source === 'retargeting' || source === 'lookalike')) {
      setError(`${source === 'retargeting' ? 'Retargeting' : 'Lookalike audiences'} require a paid subscription. Please upgrade to access this feature.`);
      return;
    }

    if (!hasImportFeature && source === 'import') {
      setError('Contact import requires a paid subscription. Please upgrade to access this feature.');
      return;
    }

    setSelectedSource(source);

    // Load appropriate leads based on source
    try {
      setLoading(true);
      switch (source) {
        case 'discover':
          await loadPreviewLeads(selectedCount);
          break;
        case 'retargeting':
          if (subscription?.tier === 'free') {
            setError('Retargeting requires a paid subscription');
            return;
          }
          await fetchRetargetingLeads();
          break;
        case 'lookalike':
          if (subscription?.tier === 'free') {
            setError('Lookalike audiences require a paid subscription');
            return;
          }
          await fetchLookalikeLeads();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${source} leads:`, error);
      setError(`Failed to load ${source} leads`);
    } finally {
      setLoading(false);
    }
  };

  if (subscriptionLoading || !subscription) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const maxContacts = getMaxContacts();
  const maxAllowed = Math.min(maxContacts, subscription?.limits || 0); 
  const currentTier = subscription && subscription.tier && subscriptionTiers ? subscriptionTiers[subscription.tier] : null;

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => handleAudienceSourceChange('retargeting')}>Retargeting Audience</button>
        <button onClick={() => handleAudienceSourceChange('lookalike')}>Lookalike Audience</button>
      </div>
      {step === 'select' ? (
        <>
          {/* Lead Preview Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Leads
              </h3>
              
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <>
                  {/* Preview Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewLeads.map((lead, index) => (
                          <tr key={index} className={index >= 3 ? 'opacity-40' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {index < 3 ? (
                                <div className="text-sm font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-gray-900">
                                  ••••• •••••
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {index < 3 ? lead.title : '•••••'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {index < 3 ? lead.company : '•••••'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Upgrade Banner */}
                  {!subscription || subscription.tier === 'free' ? (
                    <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex flex-col space-y-4">
                        <div>
                          <h4 className="font-semibold text-xl">
                            🚀 All-in-One Platform for Dropshippers
                          </h4>
                          <p className="text-sm opacity-90 mt-2">
                            • AI-Powered Lead Generation
                            • Smart Email Marketing
                            • SMS Integration
                            • {totalLeadsAvailable.toLocaleString()} More Verified Leads
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <p className="text-sm opacity-90">
                            Start converting more leads into customers today!
                          </p>
                          <button
                            onClick={() => router.push('/dashboard/subscription')}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50"
                          >
                            Upgrade Now →
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Import Your Own Contacts
            </h3>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {importedContacts.length > 0 && (
                <p className="text-sm text-gray-600">
                  {importedContacts.length} valid contacts found
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        // Review Step
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Selected Contacts
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {importedContacts.length > 0
              ? `${importedContacts.length} contacts will be used in your campaign`
              : `${previewLeads.length} preview leads will be used in your campaign`}
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 