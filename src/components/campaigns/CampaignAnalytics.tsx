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
import { ApolloService } from '../../services/apollo';

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
  const apolloService = new ApolloService();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apolloService.getCampaignAnalytics(campaignId);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [campaignId]);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Campaign Analytics</h2>
      <div className="mt-4">
        <p>Sent: {analytics.sent}</p>
        <p>Delivered: {analytics.delivered}</p>
        <p>Opened: {analytics.opened}</p>
        <p>Clicked: {analytics.clicked}</p>
        <p>Bounced: {analytics.bounced}</p>
        <p>Unsubscribed: {analytics.unsubscribed}</p>
        <p>Complaints: {analytics.complaints}</p>
      </div>
      {/* Additional analytics data can be displayed here */}
    </div>
  );
};

export default CampaignAnalytics; 