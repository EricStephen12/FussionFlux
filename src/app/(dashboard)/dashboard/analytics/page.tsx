// @ts-nocheck  
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription as useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useSubscription } from '@/hooks/useSubscription';
import { firestoreService } from '@/services/firestore';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const LineChart = dynamic(() => import('@/components/LineChart'), { ssr: false });
const BarChart = dynamic(() => import('@/components/BarChart'), { ssr: false });

// Simplified data model focusing on realistic metrics
interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    totalEmails: number;
    averageOpenRate: number;
    averageClickRate: number;
  };
  // Simplified trends data
  trends: {
    dates: string[];
    opens: number[];
    clicks: number[];
  };
  // Basic campaign performance
  topCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    clickRate: number;
    sentDate: string;
  }>;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { subscription } = useSubscriptionContext();
  const { checkFeatureAccess } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
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

      if (!user) {
        throw new Error('Please sign in to view analytics');
      }

      // Initialize default data with safe fallbacks
      const defaultData: AnalyticsData = {
        overview: {
          totalCampaigns: 0,
          totalEmails: 0,
          averageOpenRate: 0,
          averageClickRate: 0
        },
        trends: {
          dates: [],
          opens: [],
          clicks: []
        },
        topCampaigns: []
      };

      // If no subscription, set up empty defaults
      if (!subscription) {
        setAnalyticsData(defaultData);
        return;
      }

      // For free tier, show basic analytics with limited data
      if (subscription.tier === 'free') {
        try {
          // Attempt to load basic analytics
          const basicData = await firestoreService.getBasicAnalytics(user.uid);
          
          // Apply fallbacks for missing data
          setAnalyticsData({
            overview: {
              totalCampaigns: basicData?.totalCampaigns || 0,
              totalEmails: basicData?.totalEmails || 0,
              averageOpenRate: basicData?.averageOpenRate || 0,
              averageClickRate: basicData?.averageClickRate || 0
            },
            trends: {
              dates: basicData?.trends?.dates || [],
              opens: basicData?.trends?.opens || [],
              clicks: basicData?.trends?.clicks || []
            },
            topCampaigns: basicData?.topCampaigns || []
          });
        } catch (error) {
          console.error('Error loading basic analytics:', error);
          setAnalyticsData(defaultData);
        }
        return;
      }

      // For paid tiers, load more detailed analytics
      try {
      const data = await firestoreService.getAnalytics(user.uid);
        setAnalyticsData(data || defaultData);
      } catch (error) {
        console.error('Error loading detailed analytics:', error);
        setAnalyticsData(defaultData);
      }
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

  // All users now see some form of analytics (free tier gets basics)
  // This removes the upgrade message entirely, as we now check feature access properly
  
  // Show basic analytics for free tier
  if (subscription?.tier === 'free' && checkFeatureAccess('analytics')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Basic email campaign performance metrics
          </p>
        </div>

        {/* Basic Analytics Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {analyticsData && (
            <>
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
            </>
          )}
        </div>

        {/* Top Campaigns Section - Simple Table */}
        {analyticsData?.topCampaigns && analyticsData.topCampaigns.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md mt-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Campaign Performance</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {analyticsData.topCampaigns.slice(0, 3).map((campaign) => (
                <li key={campaign.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">{campaign.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {new Date(campaign.sentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Open Rate: {campaign.openRate.toFixed(1)}%
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Click Rate: {campaign.clickRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Premium Analytics Upgrade Banner */}
        <div className="bg-indigo-50 border-l-4 border-indigo-400 p-6 mt-8 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-indigo-500" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-indigo-800">Unlock Premium Analytics</h3>
              <p className="mt-2 text-indigo-700">
                Upgrade to get detailed campaign performance data, trend analysis, and engagement metrics to optimize your email marketing.
              </p>
              <div className="mt-4">
                <Link 
                  href="/dashboard/billing" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Compare Plans
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Premium Includes</p>
                  <p className="text-sm text-gray-700">Detailed Email Metrics</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Premium Includes</p>
                  <p className="text-sm text-gray-700">Weekly & Monthly Trends</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Premium Includes</p>
                  <p className="text-sm text-gray-700">Campaign Comparison</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  // Full Analytics for paid plans
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Comprehensive analytics to track and optimize your email marketing campaigns
        </p>
      </div>

      {/* Time Range Selector - Simplified */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {(['7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeframe(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeframe === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
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

      {/* Line Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Email Performance Trends</h3>
        <div className="h-72">
          {analyticsData.trends.dates.length > 0 ? (
            <LineChart
              data={analyticsData.trends.dates.map((date, index) => ({
                date,
                opens: analyticsData.trends.opens[index] || 0,
                clicks: analyticsData.trends.clicks[index] || 0
              }))}
              xKey="date"
              series={[
                { key: 'opens', name: 'Opens', color: '#4F46E5' },
                { key: 'clicks', name: 'Clicks', color: '#10B981' }
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No trend data available for the selected period</p>
          </div>
          )}
        </div>
      </div>

      {/* Top Campaigns Table - Full Version */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Campaign Performance</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed metrics for your recent campaigns</p>
        </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Rate
                  </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Click Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.topCampaigns && analyticsData.topCampaigns.length > 0 ? (
                analyticsData.topCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(campaign.sentDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${
                        campaign.openRate > 20 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {campaign.openRate.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${
                        campaign.clickRate > 3 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {campaign.clickRate.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No campaign data available
                  </td>
                </tr>
              )}
              </tbody>
            </table>
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
        <h3 className="text-lg font-medium text-indigo-800 mb-4">Optimization Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Improve Open Rates</h4>
            <p className="mt-1 text-sm text-gray-600">
              Test different subject lines and send times to increase your open rates.
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900">Boost Click Rates</h4>
            <p className="mt-1 text-sm text-gray-600">
              Make your call-to-action buttons stand out and personalize your content.
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Tracking - Coming Soon */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Tracking</h2>
        
        <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-medium text-indigo-700">Coming Soon</h3>
          </div>
          
          <p className="text-gray-700 mb-4">
            Our team is building comprehensive revenue tracking to help you measure the ROI of your email campaigns.
            This feature will be available in a future update.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-1">Campaign Revenue</h4>
              <p className="text-sm text-gray-500">Track revenue generated from each email campaign</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-1">Conversion Analytics</h4>
              <p className="text-sm text-gray-500">See which campaigns drive the most sales</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-1">ROI Calculator</h4>
              <p className="text-sm text-gray-500">Measure the return on investment for your campaigns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}