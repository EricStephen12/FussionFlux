'use client';

import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchCampaignAnalytics, updateCampaignStatus } from '@/services/campaignApi';

interface CampaignMetrics {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complaints: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  timeData: {
    timestamp: string;
    opens: number;
    clicks: number;
    unsubscribes: number;
  }[];
  deviceData: {
    device: string;
    count: number;
  }[];
  locationData: {
    country: string;
    count: number;
  }[];
}

interface CampaignAnalyticsProps {
  campaignId: string;
}

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ campaignId }) => {
  const [analyticsData, setAnalyticsData] = useState<CampaignMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscription } = useSubscription();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchCampaignAnalytics(campaignId);
        setAnalyticsData(data);
      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        setError(error.message || 'Failed to fetch campaign analytics');
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [campaignId]);

  const handleCampaignAction = async (action: 'run' | 'pause' | 'stop') => {
    try {
      await updateCampaignStatus(campaignId, action);
      alert(`Campaign ${action}ed successfully!`);
      // Refetch analytics after action
      const data = await fetchCampaignAnalytics(campaignId);
      setAnalyticsData(data);
    } catch (error: any) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`Failed to ${action} campaign. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-600">No analytics data available</p>
      </div>
    );
  }

  // Check if the user exceeds their email or SMS limits before displaying analytics
  if (subscription.maxEmails <= 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-600">You have reached your email limit. Please upgrade your subscription.</p>
      </div>
    );
  }

  if (subscription.maxSMS <= 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-600">You have reached your SMS limit. Please upgrade your subscription.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Campaign Analytics</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-xl font-semibold">{analyticsData.sent.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-xl font-semibold">{analyticsData.delivered.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Opened</p>
          <p className="text-xl font-semibold">{analyticsData.opened.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Clicked</p>
          <p className="text-xl font-semibold">{analyticsData.clicked.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Open Rate</p>
          <p className="text-xl font-semibold">{analyticsData.openRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Click Rate</p>
          <p className="text-xl font-semibold">{analyticsData.clickRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Bounce Rate</p>
          <p className="text-xl font-semibold">{analyticsData.bounceRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-500">Unsubscribed</p>
          <p className="text-xl font-semibold">{analyticsData.unsubscribed.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <h3 className="text-md font-semibold mb-4">Performance Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData.timeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opens" stroke="#8884d8" name="Opens" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
              <Line type="monotone" dataKey="unsubscribes" stroke="#ff7300" name="Unsubscribes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => handleCampaignAction('run')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Run Campaign
        </button>
        <button
          onClick={() => handleCampaignAction('pause')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          Pause Campaign
        </button>
        <button
          onClick={() => handleCampaignAction('stop')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Stop Campaign
        </button>
      </div>
    </div>
  );
};

export default CampaignAnalytics; 