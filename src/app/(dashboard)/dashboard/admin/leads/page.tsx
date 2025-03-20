'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/LeadService';
import { Lead, LeadSource, LeadStats, LeadSourceConfig } from '@/models/LeadTypes';
import {
  ChartPieIcon,
  FolderPlusIcon,
  UsersIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

// Types for admin alerts
interface AdminAlert {
  id: string;
  type: 'api_limit' | 'error' | 'info';
  source: LeadSource;
  creditsRemaining: number;
  apiKey: string;
  createdAt: string;
  status: 'read' | 'unread';
  message?: string;
}

// Mock function to get admin alerts
const getAdminAlerts = async (): Promise<AdminAlert[]> => {
  // In a real implementation, this would fetch from the database
  return [
    {
      id: '1',
      type: 'api_limit',
      source: 'apollo',
      creditsRemaining: 5,
      apiKey: 'apollo_k...',
      createdAt: new Date().toISOString(),
      status: 'unread',
      message: 'Apollo API credits are running low. Only 5 credits remaining.'
    }
  ];
};

const AdminLeadsDashboard: React.FC = () => {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSourceConfig[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not an admin
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
    
    loadDashboardData();
  }, [user, isAdmin, router]);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch lead stats
      const [leadStats, sources, adminAlerts] = await Promise.all([
        leadService.getLeadStats(),
        leadService.getActiveLeadSources(),
        getAdminAlerts()
      ]);
      
      setStats(leadStats);
      setLeadSources(sources);
      setAlerts(adminAlerts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualFetch = async () => {
    if (fetching) return;
    
    try {
      setFetching(true);
      setError(null);
      
      // Call the cron API endpoint
      const response = await fetch('/api/cron/daily-lead-fetch', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_API_KEY || 'test-key'}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger lead fetch');
      }
      
      const result = await response.json();
      
      // Show success message
      alert(`Successfully fetched ${result.result.totalFetched} leads!`);
      
      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error triggering manual fetch:', error);
      setError('Failed to trigger lead fetch. Please try again.');
    } finally {
      setFetching(false);
    }
  };
  
  const handleToggleSourceActive = async (sourceId: string, active: boolean) => {
    try {
      const source = leadSources.find(s => s.id === sourceId);
      
      if (!source) return;
      
      // Update the source
      await leadService.updateLeadSource({
        ...source,
        active
      });
      
      // Update local state
      setLeadSources(leadSources.map(s => 
        s.id === sourceId ? { ...s, active } : s
      ));
      
      // Show success message
      alert(`${source.source} ${active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating source:', error);
      setError('Failed to update source. Please try again.');
    }
  };
  
  const handleUpdateSourceConfig = async (sourceId: string, updates: Partial<LeadSourceConfig>) => {
    try {
      const source = leadSources.find(s => s.id === sourceId);
      
      if (!source) return;
      
      // Update the source
      await leadService.updateLeadSource({
        ...source,
        ...updates
      });
      
      // Update local state
      setLeadSources(leadSources.map(s => 
        s.id === sourceId ? { ...s, ...updates } : s
      ));
      
      // Show success message
      alert(`${source.source} updated successfully!`);
    } catch (error) {
      console.error('Error updating source:', error);
      setError('Failed to update source. Please try again.');
    }
  };
  
  const handleUpdateApiKey = async (sourceId: string, apiKey: string) => {
    try {
      const source = leadSources.find(s => s.id === sourceId);
      
      if (!source) return;
      
      // Update the API key
      await handleUpdateSourceConfig(sourceId, {
        apiKey,
        creditsRemaining: 100, // Reset credits (this would depend on the actual API)
        creditsUsedToday: 0
      });
      
      // Show success message
      alert(`API key for ${source.source} updated successfully!`);
    } catch (error) {
      console.error('Error updating API key:', error);
      setError('Failed to update API key. Please try again.');
    }
  };
  
  const handleMarkAlertAsRead = async (alertId: string) => {
    // In a real implementation, this would update the database
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'read' } : alert
    ));
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Lead Management Dashboard</h1>
        <button
          onClick={handleManualFetch}
          disabled={fetching}
          className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            fetching ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {fetching ? (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              Fetching...
            </>
          ) : (
            <>
              <FolderPlusIcon className="w-5 h-5 mr-2" />
              Fetch Leads Now
            </>
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          <p className="flex items-center">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            {error}
          </p>
        </div>
      )}
      
      {/* Alerts section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Alerts</h2>
          <div className="grid grid-cols-1 gap-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 rounded-lg border ${
                  alert.status === 'unread' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {alert.type === 'api_limit' && `Low API Credits: ${alert.source}`}
                      {alert.type === 'error' && `Error: ${alert.source}`}
                      {alert.type === 'info' && `Info: ${alert.source}`}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message || 'No message provided.'}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleMarkAlertAsRead(alert.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Mark as Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Stats section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Lead Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartPieIcon className="w-10 h-10 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="text-3xl font-semibold">{stats?.totalLeads.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FolderPlusIcon className="w-10 h-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Leads Added Today</p>
                <p className="text-3xl font-semibold">{stats?.leadsAddedToday.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UsersIcon className="w-10 h-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Campaigns Using</p>
                <p className="text-3xl font-semibold">{stats?.campaignsUsing.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AdjustmentsHorizontalIcon className="w-10 h-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Conversion Rate</p>
                <p className="text-3xl font-semibold">{(stats?.averageConversionRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Source breakdown */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Lead Sources</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Fetch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leadSources.map((source) => (
                <tr key={source.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 capitalize">{source.source}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stats?.leadsPerSource[source.source].toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      source.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {source.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {source.lastFetch
                      ? new Date(source.lastFetch).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      (source.creditsRemaining || 0) < 20
                        ? 'text-red-600 font-medium'
                        : 'text-gray-900'
                    }`}>
                      {source.creditsRemaining || 0} remaining
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {source.creditsUsedToday || 0} used today
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleSourceActive(source.id, !source.active)}
                      className={`mr-3 ${
                        source.active
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {source.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        const apiKey = prompt(`Enter new API key for ${source.source}:`, source.apiKey || '');
                        if (apiKey) {
                          handleUpdateApiKey(source.id, apiKey);
                        }
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Update API Key
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Source Performance */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Source Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.keys(stats?.sourcePerformance || {}).map((source) => {
            const performance = stats?.sourcePerformance[source as LeadSource];
            if (!performance) return null;
            
            return (
              <div key={source} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 capitalize mb-4">{source}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-500">Conversion Rate</span>
                      <span className="text-sm font-medium text-gray-900">{(performance.conversionRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, performance.conversionRate * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-500">Open Rate</span>
                      <span className="text-sm font-medium text-gray-900">{(performance.openRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, performance.openRate * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-500">Click Rate</span>
                      <span className="text-sm font-medium text-gray-900">{(performance.clickRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, performance.clickRate * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminLeadsDashboard; 