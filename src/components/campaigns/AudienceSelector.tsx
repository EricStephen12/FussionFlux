'use client';

import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ChartPieIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { creditsService } from '../../services/trial';
import LoadingSpinner from '../LoadingSpinner';
import { apolloClientService } from '@/services/apollo-client';
import { useAuth } from '@/contexts/AuthContext'; // Importing the authentication context
import { leadService } from '@/services/LeadService';
import { Lead, LeadSource } from '@/models/LeadTypes';
import { debounce } from 'lodash';
import { Slider } from '@mui/material';

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
  const [selectedSource, setSelectedSource] = useState<'discover' | 'import' | 'retargeting' | 'lookalike' | 'followup'>('discover');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<Lead[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minScore, setMinScore] = useState(50);
  const [leadSources, setLeadSources] = useState<LeadSource[]>(['apollo', 'facebook', 'tiktok']);

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

      // Use the client-side Apollo service to fetch leads
      const industries = selectedNiche ? apolloClientService.getIndustriesForNiche(selectedNiche) : ['Software'];
      const titles = selectedNiche ? apolloClientService.getTitlesForNiche(selectedNiche) : ['Manager'];
      
      const fetchedLeads = await apolloClientService.searchContacts({
        industry: industries,
        title: titles,
        limit: requestedCount
      });
      
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
        // Example implementation using client-side service
        const industries = selectedNiche ? apolloClientService.getIndustriesForNiche(selectedNiche) : ['Software'];
        const titles = selectedNiche ? apolloClientService.getTitlesForNiche(selectedNiche) : ['Manager'];
        
        const retargetingLeads = await apolloClientService.searchContacts({
          industry: industries,
          title: titles,
          limit: 50
        });
        
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
        // Example implementation using client-side service
        const industries = selectedNiche ? apolloClientService.getIndustriesForNiche(selectedNiche) : ['Software'];
        const titles = selectedNiche ? apolloClientService.getTitlesForNiche(selectedNiche) : ['Manager'];
        
        const lookalikeLeads = await apolloClientService.searchContacts({
          industry: industries,
          title: titles,
          limit: 50
        });
        
        setLookalikeLeads(lookalikeLeads);
        onSelect(lookalikeLeads.length, lookalikeLeads);
    } catch (error) {
        console.error('Error fetching lookalike leads:', error);
        setError('Failed to load lookalike leads');
    } finally {
        setLoading(false);
    }
  };

  const fetchFollowupLeads = async () => {
    try {
      setLoading(true);
      // Example implementation using client-side service to fetch from previous campaign contacts
      const industries = selectedNiche ? apolloClientService.getIndustriesForNiche(selectedNiche) : ['Software'];
      const titles = selectedNiche ? apolloClientService.getTitlesForNiche(selectedNiche) : ['Manager'];
      
      // Here we'd normally fetch contacts from previous campaigns who've engaged 
      // For now, we'll simulate with Apollo client
      const followupLeads = await apolloClientService.searchContacts({
        industry: industries,
        title: titles,
        limit: 50,
        // In real implementation, filter by previous engagement
        engagementRate: 0.3 
      });
      
      setLeads(followupLeads);
      onSelect(followupLeads.length, followupLeads);
    } catch (error) {
      console.error('Error fetching follow-up leads:', error);
      setError('Failed to load follow-up leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceSourceChange = async (source: 'discover' | 'import' | 'retargeting' | 'lookalike' | 'followup') => {
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

    if (!hasFullAccess && (source === 'retargeting' || source === 'lookalike' || source === 'followup')) {
      setError(`${source === 'retargeting' ? 'Retargeting' : source === 'lookalike' ? 'Lookalike audiences' : 'Follow-up campaigns'} require a paid subscription. Please upgrade to access this feature.`);
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
        case 'followup':
          if (subscription?.tier === 'free') {
            setError('Follow-up campaigns require a paid subscription');
            return;
          }
          await fetchFollowupLeads();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${source} leads:`, error);
      setError(`Failed to load ${source} leads`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce(async () => {
    if (!searchQuery && !industry && !title && !location) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Use the new leadService instead of directly calling Apollo
      const leads = await leadService.getLeads({
        industry: industry ? [industry] : undefined,
        title: title ? [title] : undefined,
        location: location ? [location] : undefined,
        minScore,
        sources: leadSources,
        limit: 50
      });

      setResults(leads);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search for leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, industry, title, location, minScore, leadSources]);

  const handleSelectAudience = (audience: Lead) => {
    // Check if already selected
    const isSelected = leads.some(a => a.id === audience.id);
    
    if (isSelected) {
      onSelect(leads.length - 1, leads.filter(a => a.id !== audience.id));
    } else {
      onSelect(leads.length + 1, [...leads, audience]);
    }
  };

  const isSelected = (audience: Lead) => {
    return leads.some(a => a.id === audience.id);
  };

  const handleSourceToggle = (source: LeadSource) => {
    if (leadSources.includes(source)) {
      setLeadSources(leadSources.filter(s => s !== source));
    } else {
      setLeadSources([...leadSources, source]);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button 
          onClick={() => handleAudienceSourceChange('discover')}
          className={`flex flex-col items-center p-3 rounded-lg border ${
            selectedSource === 'discover' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
          }`}
        >
          <UserGroupIcon className="h-6 w-6 text-indigo-600 mb-1" />
          <span className="text-sm font-medium">New Contacts</span>
        </button>
        
        <button 
          onClick={() => handleAudienceSourceChange('retargeting')}
          className={`flex flex-col items-center p-3 rounded-lg border ${
            selectedSource === 'retargeting' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
          }`}
        >
          <ChartPieIcon className="h-6 w-6 text-indigo-600 mb-1" />
          <span className="text-sm font-medium">Engaged Visitors</span>
        </button>
        
        <button 
          onClick={() => handleAudienceSourceChange('lookalike')}
          className={`flex flex-col items-center p-3 rounded-lg border ${
            selectedSource === 'lookalike' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
          }`}
        >
          <SparklesIcon className="h-6 w-6 text-indigo-600 mb-1" />
          <span className="text-sm font-medium">Similar Profiles</span>
        </button>
        
        <button 
          onClick={() => handleAudienceSourceChange('followup')}
          className={`flex flex-col items-center p-3 rounded-lg border ${
            selectedSource === 'followup' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
          }`}
        >
          <RocketLaunchIcon className="h-6 w-6 text-indigo-600 mb-1" />
          <span className="text-sm font-meter">Previous Campaigns</span>
        </button>
      </div>
      {step === 'select' ? (
        <>
          {/* Search and filter controls */}
          <div className="flex flex-col space-y-4">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search for leads..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="ml-2 p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>

            {filterOpen && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Retail"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Marketing Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Lead Score: {minScore}
                  </label>
                  <Slider
                    value={minScore}
                    onChange={(_, value) => setMinScore(value as number)}
                    aria-labelledby="lead-score-slider"
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Sources
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'apollo', name: 'Business Data' },
                      { id: 'facebook', name: 'Social Media 1' },
                      { id: 'tiktok', name: 'Social Media 2' },
                      { id: 'instagram', name: 'Social Media 3' },
                      { id: 'google', name: 'Search & Maps' }
                    ].map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceToggle(source.id as LeadSource)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          leadSources.includes(source.id as LeadSource)
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {results.length} leads found
              {leads.length > 0 && ` (${leads.length} selected)`}
            </h3>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {results.map((lead) => (
                    <li
                      key={lead.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        isSelected(lead) ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => handleSelectAudience(lead)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                              {lead.source}
                            </span>
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                              Score: {lead.score}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {lead.title} {lead.company && `at ${lead.company}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {lead.email}
                          </p>
                          <div className="mt-1">
                            {lead.industry && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                {lead.industry}
                              </span>
                            )}
                            {lead.location && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {lead.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {isSelected(lead) ? (
                            <CheckIcon className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <button
                              className="text-sm text-indigo-600 hover:text-indigo-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAudience(lead);
                              }}
                            >
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {results.length === 0 && !loading && (
                    <li className="p-8 text-center text-gray-500">
                      No leads found. Try adjusting your search criteria.
                    </li>
                  )}
                </ul>
              </div>
            )}
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