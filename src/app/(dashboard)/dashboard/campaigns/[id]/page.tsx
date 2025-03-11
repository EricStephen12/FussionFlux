'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EnvelopeIcon,
  ChartPieIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, type Campaign } from '@/services/firestore';
import LineChart from '@/components/LineChart';
import AIInsights from '@/components/campaigns/AIInsights';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const campaignData = await firestoreService.getCampaign(params.id);

      if (!campaignData) {
        throw new Error('Campaign not found');
      }

      setCampaign(campaignData);
    } catch (error: any) {
      setError(error.message || 'Failed to load campaign');
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Campaign Results</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your campaign performance and ROI in real-time
        </p>
      </div>

      <div className="mb-8">
        <AIInsights campaignId={params.id} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{campaign.sentCount || 0}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Opens</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{campaign.openCount || 0}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Clicks</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">{campaign.clickCount || 0}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {campaign.clickCount && campaign.sentCount 
                ? `${((campaign.clickCount / campaign.sentCount) * 100).toFixed(1)}%` 
                : '0%'}
            </dd>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h2>
        
        {/* Progress Timeline */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-between">
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">Sent</span>
              <div className="mt-2 text-indigo-600">
                {campaign.createdAt ? new Date(campaign.createdAt).toLocaleTimeString() : 'Not sent'}
              </div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">First Open</span>
              <div className="mt-2 text-indigo-600">
                {campaign.firstOpenAt ? new Date(campaign.firstOpenAt).toLocaleTimeString() : 'No opens yet'}
              </div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">First Click</span>
              <div className="mt-2 text-indigo-600">
                {campaign.firstClickAt ? new Date(campaign.firstClickAt).toLocaleTimeString() : 'No clicks yet'}
              </div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">Latest Activity</span>
              <div className="mt-2 text-indigo-600">
                {campaign.lastActivityAt ? new Date(campaign.lastActivityAt).toLocaleTimeString() : 'No activity'}
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Graph */}
        {campaign.engagementData && campaign.engagementData.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">Engagement Over Time</h3>
            <div className="mt-3 h-96">
              <LineChart
                data={campaign.engagementData}
                categories={['Opens', 'Clicks', 'Conversions']}
              />
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center text-gray-500">
            No engagement data available yet
        </div>
        )}

        {/* Action Items */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">Recommended Actions</h3>
          {campaign.recommendedActions && campaign.recommendedActions.length > 0 ? (
          <ul className="mt-3 space-y-3">
              {campaign.recommendedActions.map((action, index) => (
                <li key={index} className="text-sm text-gray-600">
                  ✓ {action}
            </li>
              ))}
          </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              No recommended actions at this time
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 