'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';
import { firestoreService } from '@/services/firestore';
import { toast } from 'react-hot-toast';

// Types for campaign metrics
interface CampaignPerformanceData {
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
  startDate: string;
  status: 'sending' | 'sent' | 'scheduled' | 'draft' | 'paused' | 'failed' | 'stopped';
}

interface TimeSeriesData {
  date: string;
  opens: number;
  clicks: number;
  conversions?: number;
}

interface CampaignEvent {
  id: string;
  campaignId: string;
  type: 'open' | 'click' | 'bounce' | 'unsubscribe';
  timestamp: Timestamp | string;
  contactId: string;
  metadata?: any;
}

// Sample color palette for charts
const COLORS = ['#4f46e5', '#0ea5e9', '#22c55e', '#eab308', '#f59e0b', '#ef4444'];

const CampaignPerformance = ({ campaigns }: { campaigns: any[] }) => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7days' | '30days' | '90days'>('30days');
  const [performanceData, setPerformanceData] = useState<CampaignPerformanceData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [campaignEvents, setCampaignEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaign performance data and events
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);

        // Transform campaigns prop into performance data with accurate calculations
        const processedData = campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          sent: campaign.stats?.sent || 0,
          delivered: campaign.stats?.delivered || 0,
          opened: campaign.stats?.opened || 0, 
          clicked: campaign.stats?.clicked || 0,
          bounced: campaign.stats?.bounced || 0,
          unsubscribed: campaign.stats?.unsubscribed || 0,
          openRate: campaign.stats?.sent > 0 ? (campaign.stats.opened / campaign.stats.sent) * 100 : 0,
          clickRate: campaign.stats?.opened > 0 ? (campaign.stats.clicked / campaign.stats.opened) * 100 : 0,
          startDate: campaign.startDate || campaign.scheduledDate || new Date().toISOString(),
          status: campaign.status || 'draft',
        }));

        setPerformanceData(processedData);

        // Fetch campaign events from Firestore
        await fetchCampaignEvents();

        // Generate time series data
        generateTimeSeriesData(selectedTimeframe);
      } catch (err) {
        console.error('Error fetching campaign performance data:', err);
        setError('Failed to load campaign performance data. Please try again.');
        toast.error('Failed to load campaign analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaigns, user]);

  // Fetch all campaign events from Firestore
  const fetchCampaignEvents = async () => {
    if (!user) return;
    
    try {
      const campaignIds = campaigns.map(campaign => campaign.id);
      if (campaignIds.length === 0) return;
      
      // Get campaign events from Firestore
      const eventsRef = collection(firestoreService.db, 'campaignEvents');
      const q = query(
        eventsRef, 
        where('campaignId', 'in', campaignIds),
        orderBy('timestamp', 'desc'),
        limit(1000) // Limit to last 1000 events
      );
      
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CampaignEvent[];
      
      setCampaignEvents(events);
    } catch (error) {
      console.error('Error fetching campaign events:', error);
    }
  };

  // Generate time series data based on timeframe and real events
  const generateTimeSeriesData = (timeframe: string) => {
    const days = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;
    const data: TimeSeriesData[] = [];
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    // Create date map for each day in the timeframe
    const dateMap: {[key: string]: {opens: number, clicks: number, conversions: number}} = {};
    
    // Initialize all dates with zero values
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      dateMap[dateString] = { opens: 0, clicks: 0, conversions: 0 };
    }
    
    // Fill in data from actual events
    campaignEvents.forEach(event => {
      // Convert Firestore timestamp to JS Date
      const timestamp = event.timestamp instanceof Timestamp 
        ? event.timestamp.toDate() 
        : new Date(event.timestamp);
      
      const dateString = timestamp.toISOString().split('T')[0];
      
      // Only include events within our timeframe
      if (dateMap[dateString]) {
        if (event.type === 'open') {
          dateMap[dateString].opens += 1;
        } else if (event.type === 'click') {
          dateMap[dateString].clicks += 1;
        }
        // If you have conversion data, add it here
      }
    });
    
    // Convert to array for chart
    Object.keys(dateMap).sort().forEach(date => {
      data.push({
        date,
        opens: dateMap[date].opens,
        clicks: dateMap[date].clicks,
        conversions: dateMap[date].conversions
      });
    });
    
    setTimeSeriesData(data);
  };

  // Calculate average metrics
  const calculateAverages = () => {
    if (performanceData.length === 0) return { avgOpenRate: 0, avgClickRate: 0, totalSent: 0 };
    
    const totalSent = performanceData.reduce((sum, campaign) => sum + campaign.sent, 0);
    const totalOpened = performanceData.reduce((sum, campaign) => sum + campaign.opened, 0);
    const totalClicked = performanceData.reduce((sum, campaign) => sum + campaign.clicked, 0);
    
    const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    
    return {
      avgOpenRate: parseFloat(avgOpenRate.toFixed(2)),
      avgClickRate: parseFloat(avgClickRate.toFixed(2)),
      totalSent
    };
  };

  const { avgOpenRate, avgClickRate, totalSent } = calculateAverages();

  // Generate data for engagement by hour using real events
  const getEngagementByHour = () => {
    const hourData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      opens: 0,
      clicks: 0,
    }));
    
    campaignEvents.forEach(event => {
      // Convert timestamp to hour
      const timestamp = event.timestamp instanceof Timestamp 
        ? event.timestamp.toDate() 
        : new Date(event.timestamp);
      
      const hour = timestamp.getHours();
      
      if (event.type === 'open') {
        hourData[hour].opens += 1;
      } else if (event.type === 'click') {
        hourData[hour].clicks += 1;
      }
    });
    
    return hourData;
  };

  // Status counts for pie chart
  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      sent: 0,
      sending: 0,
      scheduled: 0,
      draft: 0,
      paused: 0,
      stopped: 0,
      failed: 0,
    };
    
    performanceData.forEach(campaign => {
      if (counts[campaign.status] !== undefined) {
        counts[campaign.status]++;
      }
    });
    
    return Object.keys(counts).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: counts[key]
    }));
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: '7days' | '30days' | '90days') => {
    setSelectedTimeframe(timeframe);
    generateTimeSeriesData(timeframe);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-center">
        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
        <span>{error}</span>
        <button 
          onClick={() => window.location.reload()}
          className="ml-auto bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-3 rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (performanceData.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No campaign data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Send your first campaign to start seeing analytics data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Campaign Performance</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleTimeframeChange('7days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedTimeframe === '7days'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => handleTimeframeChange('30days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedTimeframe === '30days'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => handleTimeframeChange('90days')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              selectedTimeframe === '90days'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{avgOpenRate}%</p>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium">
            <span className={avgOpenRate > 20 ? "text-green-600" : "text-yellow-600"}>
              {avgOpenRate > 20 ? "Good" : "Needs Improvement"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Click Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{avgClickRate}%</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium">
            <span className={avgClickRate > 2 ? "text-green-600" : "text-yellow-600"}>
              {avgClickRate > 2 ? "Good" : "Needs Improvement"}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{totalSent.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <EnvelopeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-gray-500">
            Across {performanceData.length} campaigns
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performanceData.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-gray-500">
            {performanceData.filter(c => c.status === 'sending').length} sending, 
            {performanceData.filter(c => c.status === 'scheduled').length} scheduled
          </div>
        </div>
      </div>

      {/* Engagement Over Time Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="opens" stackId="1" stroke="#4f46e5" fill="#4f46e5" />
              <Area type="monotone" dataKey="clicks" stackId="2" stroke="#0ea5e9" fill="#0ea5e9" />
              {timeSeriesData[0]?.conversions && (
                <Area type="monotone" dataKey="conversions" stackId="3" stroke="#22c55e" fill="#22c55e" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance Comparison</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData.slice(0, 5)} // Only show top 5 campaigns
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="openRate" name="Open Rate (%)" fill="#4f46e5" />
                <Bar dataKey="clickRate" name="Click Rate (%)" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Status Distribution</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getStatusCounts()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getStatusCounts().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement Heatmap by Hour */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Best Time to Send (Engagement by Hour)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getEngagementByHour()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" label={{ value: 'Hour of Day (24h)', position: 'insideBottom', offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="opens" name="Opens" fill="#4f46e5" />
              <Bar dataKey="clicks" name="Clicks" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CampaignPerformance; 