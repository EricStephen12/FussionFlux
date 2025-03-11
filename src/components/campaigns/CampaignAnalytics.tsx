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
import { apolloService } from '@/services/apollo';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchCampaignAnalytics } from '../../services/api';

interface CampaignMetrics {
  id: string;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
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
  const [analyticsData, setAnalyticsData] = useState(null);
  const subscription = useSubscription();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await fetchCampaignAnalytics(campaignId);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };
    fetchAnalytics();
  }, [campaignId]);

  const handleCampaignAction = async (action: 'run' | 'pause' | 'stop') => {
    try {
      await apolloService.updateCampaignStatus(campaignId, action);
      alert(`Campaign ${action}ed successfully!`);
      // Optionally, refetch analytics after action
      fetchAnalytics();
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`Failed to ${action} campaign. Please try again.`);
    }
  };

  if (!analyticsData) return <div>Loading analytics...</div>;

  // Check if the user exceeds their email or SMS limits before displaying analytics
  if (subscription.maxEmails <= 0) {
    return <div>You have reached your email limit. Please upgrade your subscription.</div>;
  }
  if (subscription.maxSMS <= 0) {
    return <div>You have reached your SMS limit. Please upgrade your subscription.</div>;
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Campaign Analytics</h2>
      <div className="mt-4">
        <p>Sent: {analyticsData.sent}</p>
        <p>Delivered: {analyticsData.delivered}</p>
        <p>Opened: {analyticsData.opened}</p>
        <p>Clicked: {analyticsData.clicked}</p>
        <p>Bounced: {analyticsData.bounced}</p>
        <p>Unsubscribed: {analyticsData.unsubscribed}</p>
        <p>Complaints: {analyticsData.complaints}</p>
        <p>Remaining Emails: {subscription.maxEmails - subscription.usedEmails} / {subscription.maxEmails}</p>
        <p>Remaining SMS: {subscription.maxSMS - subscription.usedSMS} / {subscription.maxSMS}</p>
        {(subscription.maxEmails - subscription.usedEmails) < 100 && <p className='text-red-500'>Warning: You are nearing your email limit!</p>}
        {(subscription.maxSMS - subscription.usedSMS) < 50 && <p className='text-red-500'>Warning: You are nearing your SMS limit!</p>}
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <h3 className="text-md font-semibold">Performance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="opens" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
            <Line type="monotone" dataKey="unsubscribes" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex space-x-4">
        <button onClick={() => handleCampaignAction('run')} className="px-4 py-2 bg-green-500 text-white rounded">Run Campaign</button>
        <button onClick={() => handleCampaignAction('pause')} className="px-4 py-2 bg-yellow-500 text-white rounded">Pause Campaign</button>
        <button onClick={() => handleCampaignAction('stop')} className="px-4 py-2 bg-red-500 text-white rounded">Stop Campaign</button>
      </div>
      {/* Additional analytics data can be displayed here */}
    </div>
  );
};

export default CampaignAnalytics; 