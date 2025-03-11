'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { firestoreService } from '@/services/firestore';
import { paymentService } from '@/services/payment';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

const LineChart = dynamic(() => import('@/components/LineChart'), { ssr: false });
const BarChart = dynamic(() => import('@/components/BarChart'), { ssr: false });

interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    totalEmails: number;
    averageOpenRate: number;
    averageClickRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      opens: number;
      clicks: number;
      conversions: number;
    }>;
    weekly: Array<{
      date: string;
      campaigns: number;
      engagement: number;
    }>;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  cpl: number;
  cpc: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [cpl, setCpl] = useState<number>(0);
  const [cpc, setCpc] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!subscription) {
        throw new Error('No subscription found');
      }

      // Check if user has analytics access
      if (!subscription.features.analytics) {
        throw new Error('Analytics features require a subscription upgrade');
      }

      const data = await firestoreService.getAnalytics(user!.uid);
      
      // For free tier, limit the data
      if (subscription.tier === 'free') {
        data.trends.daily = data.trends.daily.slice(-7); // Last 7 days only
        data.trends.weekly = data.trends.weekly.slice(-4); // Last 4 weeks only
        data.topCampaigns = data.topCampaigns.slice(0, 3); // Top 3 campaigns only
      }

      setAnalyticsData(data);
      setCpl(data.cpl);
      setCpc(data.cpc);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analyticsData) return null;

  if (!subscription?.features.analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Access to analytics features requires an active subscription.{' '}
                <a href="/pricing" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                  Upgrade your plan
                </a>{' '}
                to unlock full analytics capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your email marketing performance and engagement metrics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeframe(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeframe === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                  <dd className="text-lg font-semibold text-indigo-600">
                    {analyticsData.overview.totalCampaigns}
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
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Emails Sent</dt>
                  <dd className="text-lg font-semibold text-indigo-600">
                    {analyticsData.overview.totalEmails.toLocaleString()}
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
                <ChartPieIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Open Rate</dt>
                  <dd className="text-lg font-semibold text-indigo-600">
                    {analyticsData.overview.averageOpenRate.toFixed(1)}%
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
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Click Rate</dt>
                  <dd className="text-lg font-semibold text-indigo-600">
                    {analyticsData.overview.averageClickRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h3>
          <div className="h-80">
            <LineChart
              data={analyticsData.trends.daily}
              categories={['Opens', 'Clicks', 'Conversions']}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Trends</h3>
          <div className="h-80">
            <BarChart
              data={analyticsData.trends.weekly}
              categories={['Campaigns', 'Engagement']}
            />
          </div>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Campaigns</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Click Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.topCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.openRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.clickRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Additional Metrics</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cost Per Lead</dt>
                    <dd className="text-lg font-semibold text-indigo-600">
                      ${cpl.toFixed(2)}
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
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cost Per Conversion</dt>
                    <dd className="text-lg font-semibold text-indigo-600">
                      ${cpc.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}