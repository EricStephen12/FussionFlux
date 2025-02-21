'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ChartPieIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSubscription } from '../../hooks/useSubscription';

interface Audience {
  id: string;
  name: string;
  count: number;
  engagement: string;
  interests: string[];
  demographics: string;
  lastActivity: string;
}

interface AudienceSelectorProps {
  onSelect: (audienceIds: string[]) => void;
  initialSelected?: string[];
}

const sampleAudiences: Audience[] = [
  {
    id: '1',
    name: 'Fashion Enthusiasts',
    count: 2345,
    engagement: '85%',
    interests: ['Luxury Fashion', 'Accessories', 'Designer Brands'],
    demographics: '25-45, Female, Urban',
    lastActivity: '2024-03-10',
  },
  {
    id: '2',
    name: 'Tech-Savvy Shoppers',
    count: 1890,
    engagement: '78%',
    interests: ['Gadgets', 'Electronics', 'Smart Home'],
    demographics: '18-35, Mixed, Tech-Focused',
    lastActivity: '2024-03-09',
  },
  {
    id: '3',
    name: 'Home Decor Enthusiasts',
    count: 1567,
    engagement: '92%',
    interests: ['Interior Design', 'Home & Living', 'DIY'],
    demographics: '28-50, Mixed, Homeowners',
    lastActivity: '2024-03-08',
  },
];

export default function AudienceSelector({
  onSelect,
  initialSelected = [],
}: AudienceSelectorProps) {
  const { tier } = useSubscription();
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minEngagement: '',
    minSize: '',
    interests: [] as string[],
  });
  const [csvContacts, setCsvContacts] = useState<string[]>([]);

  useEffect(() => {
    if (tier === 'free') {
      // Restrict to CSV upload for free tier users
      setSelectedAudiences([]);
    }
  }, [tier]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const emails = text.split(/\r?\n/).filter(line => line.includes('@'));
      setCsvContacts(emails);
    };
    reader.readAsText(file);
  };

  const handleToggleAudience = (audienceId: string) => {
    if (tier !== 'free' && selectedAudiences.length < getMaxAudiences(tier)) {
      const newSelected = selectedAudiences.includes(audienceId)
        ? selectedAudiences.filter(id => id !== audienceId)
        : [...selectedAudiences, audienceId];
      
      setSelectedAudiences(newSelected);
      onSelect(newSelected);
    }
  };

  const filteredAudiences = sampleAudiences.filter(audience => {
    const matchesSearch = audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audience.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesEngagement = !filters.minEngagement ||
      parseInt(audience.engagement) >= parseInt(filters.minEngagement);
    
    const matchesSize = !filters.minSize ||
      audience.count >= parseInt(filters.minSize);
    
    const matchesInterests = filters.interests.length === 0 ||
      filters.interests.some(interest =>
        audience.interests.some(audienceInterest =>
          audienceInterest.toLowerCase().includes(interest.toLowerCase())
        )
      );

    return matchesSearch && matchesEngagement && matchesSize && matchesInterests;
  });

  const getMaxAudiences = (tier: string) => {
    switch (tier) {
      case 'starter': return 250;
      case 'grower': return 500;
      case 'pro': return 1000;
      case 'enterprise': return 5000;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search audiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>
        <button
          onClick={() => {/* Handle creating new audience segment */}}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Segment
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Min. Engagement
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.minEngagement}
                onChange={(e) => setFilters({ ...filters, minEngagement: e.target.value })}
                placeholder="e.g. 75%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Min. Audience Size
              </label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.minSize}
                onChange={(e) => setFilters({ ...filters, minSize: e.target.value })}
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Interests
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Add interests..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value) {
                      setFilters({
                        ...filters,
                        interests: [...filters.interests, input.value],
                      });
                      input.value = '';
                    }
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {filters.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => setFilters({
                        ...filters,
                        interests: filters.interests.filter((_, i) => i !== index),
                      })}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audiences Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAudiences.map((audience) => (
          <div
            key={audience.id}
            onClick={() => handleToggleAudience(audience.id)}
            className={`relative rounded-lg border p-6 cursor-pointer ${
              selectedAudiences.includes(audience.id)
                ? 'border-indigo-500 ring-2 ring-indigo-500'
                : 'border-gray-200 hover:border-indigo-500'
            }`}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {audience.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {audience.demographics}
                </p>
              </div>
              {selectedAudiences.includes(audience.id) && (
                <div className="h-5 w-5 text-indigo-600">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                {audience.count.toLocaleString()} subscribers
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <ChartPieIcon className="h-5 w-5 mr-2" />
                {audience.engagement} engagement rate
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {audience.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tier === 'free' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Upload CSV</label>
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="mt-1 block w-full" />
          <p className="mt-2 text-sm text-gray-500">Upload a CSV file with up to 5 email addresses.</p>
        </div>
      )}
    </div>
  );
} 