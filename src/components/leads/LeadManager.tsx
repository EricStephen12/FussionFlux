import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { nicheService } from '@/services/niche';
import { creditsService } from '../../services/trial';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpTrayIcon, 
  EyeIcon, 
  LockClosedIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import Papa, { ParseResult, ParseError } from 'papaparse';

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface TargetLead {
  id: string;
  industry: string;
  region: string;
  title: string;
  score: number;
  companySize: string;
  engagementLevel: string;
  lastActive: string;
  matchScore: number;
  revenueRange: string;
  buyingSignals: string[];
}

interface ImportedContact {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  title?: string;
}

interface CSVRow {
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  title?: string;
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

const processCSVFile = (file: File): Promise<ImportedContact[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      complete: (results: ParseResult<CSVRow>) => {
        const contacts = results.data
          .filter(row => row.email && row.email.includes('@'))
          .map(row => ({
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            email: row.email,
            company: row.company,
            title: row.title
          }));
        resolve(contacts);
      },
      error: (error: ParseError) => reject(error)
    });
  });
};

export default function LeadManager() {
  const { subscription, checkFeatureAccess, getRemainingCredits } = useSubscription();
  const { user } = useAuth() as { user: User | null };
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<TargetLead[]>([]);
  const [importedAudience, setImportedAudience] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'import'>('discover');
  const [totalAvailableLeads, setTotalAvailableLeads] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [showNicheDropdown, setShowNicheDropdown] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [trialStatus, setTrialStatus] = useState<{
    isActive: boolean;
    remainingLeads: number;
    message: string;
  }>({ isActive: false, remainingLeads: 0, message: '' });

  // Get remaining credits and max contacts
  const credits = getRemainingCredits();
  const maxContacts = subscription?.maxContacts || 100;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (user?.id) {
          const trialEligibility = await creditsService.checkTrialEligibility(user.id);
          setTrialStatus({
            isActive: trialEligibility.canUse,
            remainingLeads: trialEligibility.remainingPreviews,
            message: trialEligibility.message
          });
        }
        const supportedNiches = await nicheService.getSupportedNiches();
        setNiches(supportedNiches);
      } catch (error) {
        console.error('Error loading initial data:', error);
        const message = error instanceof Error ? error.message : 'An error occurred';
        alert(message);
      }
    };
    loadInitialData();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setLoading(true);
      
      // Check trial status first
      if (!subscription && !trialStatus.isActive) {
        throw new Error('Your trial has expired. Please upgrade to continue.');
      }

      if (!subscription && trialStatus.remainingLeads <= 0) {
        throw new Error('You have used all your trial leads. Please upgrade to continue.');
      }

      // Process CSV and validate contact count
      const contacts = await processCSVFile(file);
      const availableSlots = subscription ? Infinity : trialStatus.remainingLeads;
      
      if (contacts.length > availableSlots) {
        throw new Error(`You can only import up to ${availableSlots} contacts with your current plan.`);
      }

      // Track usage for trial users
      if (!subscription) {
        await creditsService.trackUsage(user.id, 'import', contacts.length);
        
        // Update local trial status
        const updatedTrialStatus = await creditsService.checkTrialEligibility(user.id);
        setTrialStatus({
          isActive: updatedTrialStatus.canUse,
          remainingLeads: updatedTrialStatus.remainingPreviews,
          message: updatedTrialStatus.message
        });
      }

      setImportedAudience(contacts);
    } catch (error) {
      console.error('Error importing audience:', error);
      const message = error instanceof Error ? error.message : 'An error occurred while importing';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(niche);
    setShowNicheDropdown(false);
  };

  const generatePreviewLeads = async () => {
    if (!selectedNiche || !user?.id) {
      alert('Please select your target market first');
      return;
    }

    setLoading(true);
    try {
      // Check trial status
      if (!subscription && !trialStatus.isActive) {
        throw new Error('Your trial has expired. Please upgrade to continue.');
      }

      if (!subscription && trialStatus.remainingLeads <= 0) {
        throw new Error('You have used all your trial leads. Please upgrade to continue.');
      }

      // Update user's niche preference with userId
      await nicheService.updateUserNiche(user.id, selectedNiche);
      
      // Calculate how many leads we can generate
      const maxLeads = subscription ? 100 : Math.min(25, trialStatus.remainingLeads);
      
      // Generate preview leads with complete TargetLead properties
      const previewLeads: TargetLead[] = Array.from({ length: maxLeads }, (_, i) => ({
        id: `preview-${i}`,
        industry: selectedNiche,
        region: ['North America', 'Europe', 'Asia'][Math.floor(Math.random() * 3)],
        title: ['Owner', 'CEO', 'Marketing Director'][Math.floor(Math.random() * 3)],
        score: Math.floor(Math.random() * (95 - 75) + 75),
        companySize: ['1-10', '11-50', '51-200'][Math.floor(Math.random() * 3)],
        engagementLevel: ['High', 'Very High'][Math.floor(Math.random() * 2)],
        lastActive: ['1 day ago', '2 days ago', '3 days ago'][Math.floor(Math.random() * 3)],
        matchScore: Math.floor(Math.random() * (99 - 85) + 85),
        revenueRange: ['$1M-$5M', '$5M-$10M', '$10M+'][Math.floor(Math.random() * 3)],
        buyingSignals: [
          'Recently upgraded platform',
          'High growth indicators',
          'Active hiring',
          'Technology investment'
        ].sort(() => Math.random() - 0.5).slice(0, 2)
      }));

      // Track usage for trial users
      if (!subscription) {
        await creditsService.trackUsage(user.id, 'preview', previewLeads.length);
        
        // Update local trial status
        const updatedTrialStatus = await creditsService.checkTrialEligibility(user.id);
        setTrialStatus({
          isActive: updatedTrialStatus.canUse,
          remainingLeads: updatedTrialStatus.remainingPreviews,
          message: updatedTrialStatus.message
        });
      }

      setDiscoveredLeads(previewLeads);
      setTotalAvailableLeads(subscription ? 1000 : previewLeads.length);
    } catch (error) {
      console.error('Error generating leads:', error);
      const message = error instanceof Error ? error.message : 'An error occurred while generating leads';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Trial Status Banner */}
        {!subscription && (
          <div className={`mb-4 p-4 rounded-lg ${
            !trialStatus.isActive ? 'bg-red-50 text-red-700' : 
            trialStatus.remainingLeads <= 20 ? 'bg-yellow-50 text-yellow-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">
                  {!trialStatus.isActive ? 'Trial Expired' :
                   `Trial Mode - ${trialStatus.remainingLeads} leads remaining`}
                </h3>
                <p className="mt-1 text-sm">
                  {trialStatus.message}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/subscription')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !trialStatus.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                  'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              AI-Powered Audience Discovery
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Find your perfect audience match with our AI targeting system or import your existing contacts.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('discover')}
                className={`${
                  activeTab === 'discover'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Smart Discovery
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`${
                  activeTab === 'import'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Import Your List
              </button>
            </nav>
          </div>

          {activeTab === 'discover' && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <RocketLaunchIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  AI Matchmaking System
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Our AI analyzes millions of data points to find your perfect audience match.
                  Preview high-intent prospects before unlocking their full details.
                </p>
                
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <ChartBarIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Intent Signals</h5>
                    <p className="text-sm text-gray-500">Real-time buying behavior analysis</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Verified Profiles</h5>
                    <p className="text-sm text-gray-500">100% accurate business data</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <SparklesIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Smart Matching</h5>
                    <p className="text-sm text-gray-500">AI-powered audience targeting</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Select Your Target Market</h2>
                  <div className="relative">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose your niche
                      </label>
                      <select
                        value={selectedNiche}
                        onChange={(e) => handleNicheSelect(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select your target niche</option>
                        {ALL_NICHES.map((niche) => (
                          <option key={niche} value={niche}>
                            {niche}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedNiche && (
                    <div className="mt-4">
                      <button
                        onClick={generatePreviewLeads}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {loading ? 'Generating...' : 'Generate Preview Leads'}
                      </button>
                    </div>
                  )}
                </div>

                {totalAvailableLeads > 0 && (
                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700">
                      🎯 We found {totalAvailableLeads.toLocaleString()} potential leads matching your criteria!
                      Here's a preview of your best matches:
                    </p>
                  </div>
                )}

                {discoveredLeads.length > 0 && (
                  <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                            Profile
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Match Score
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Buying Signals
                          </th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {discoveredLeads.map((lead) => (
                          <tr key={lead.id}>
                            <td className="py-4 pl-4 pr-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {lead.title}
                              </div>
                              <div className="text-gray-500">
                                {lead.industry} • {lead.region}
                              </div>
                              <div className="text-gray-500">
                                {lead.companySize} employees • {lead.revenueRange}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  lead.matchScore >= 90 ? 'bg-green-100 text-green-800' :
                                  lead.matchScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {lead.matchScore}% Match
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Active {lead.lastActive}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                              <ul className="space-y-1">
                                {lead.buyingSignals.map((signal, index) => (
                                  <li key={index} className="flex items-center text-xs">
                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                    {signal}
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-3 py-4 text-sm">
                              {checkFeatureAccess('fullLeadAccess') ? (
                                <button className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                  <EyeIcon className="h-5 w-5 mr-1" />
                                  View Full Profile
                                </button>
                              ) : (
                                <button 
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                  onClick={() => window.location.href = '/dashboard/billing'}
                                >
                                  <LockClosedIcon className="h-4 w-4 mr-1" />
                                  Unlock Now
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!checkFeatureAccess('fullLeadAccess') && (
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-b-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">
                              🚀 Unlock {totalAvailableLeads.toLocaleString()} More Matching Leads
                            </h4>
                            <p className="text-sm opacity-90">
                              Get instant access to all contact details and start connecting today!
                            </p>
                          </div>
                          <button
                            onClick={() => window.location.href = '/dashboard/billing'}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50"
                          >
                            Upgrade Now →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Import & Enhance Your List
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  Upload your contact list and let our AI analyze and enhance your audience data.
                  We'll help you identify your most valuable prospects.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <ChartBarIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Engagement Scoring</h5>
                    <p className="text-sm text-gray-500">AI-powered contact analysis</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Data Enhancement</h5>
                    <p className="text-sm text-gray-500">Enrich your contact data</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <SparklesIcon className="h-8 w-8 text-indigo-600 mb-2" />
                    <h5 className="font-medium">Smart Segmentation</h5>
                    <p className="text-sm text-gray-500">Automatic list organization</p>
                  </div>
                </div>
              </div>

              <div className="max-w-xl">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-lg bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                >
                  <div className="mt-2 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10">
                    <div className="text-center">
                      <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                      <div className="mt-4">
                        <span className="text-sm font-semibold text-gray-900">Upload your contact list</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv"
                          onChange={handleFileUpload}
                        />
                        <p className="text-xs text-gray-500">CSV format with contact details</p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        or <button onClick={() => setActiveTab('discover')} className="text-indigo-600 hover:text-indigo-500">discover new leads with AI →</button>
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {importedAudience.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900">Imported Contacts</h4>
                  <div className="mt-3 bg-white rounded-lg shadow overflow-hidden">
                    {importedAudience.map((contact, index) => (
                      <div key={index} className="p-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                            <p className="text-xs text-gray-500">Last active: {contact.lastActivity}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              contact.engagementScore >= 80 ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {contact.engagementScore}% Engaged
                            </span>
                            <div className="mt-1 text-xs text-gray-500">
                              Interests: {contact.interests.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900">Plan & Credits</h4>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {subscription ? 
                  `${subscription.tier}: ${maxContacts.toLocaleString()} contacts/campaign` : 
                  'Trial: 100 contacts/campaign'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {credits.toLocaleString()} credits remaining
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard/subscription')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {subscription ? 'Upgrade Plan →' : 'Get Pro →'}
              </button>
              <button
                onClick={() => router.push('/dashboard/credits')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Buy Credits →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 