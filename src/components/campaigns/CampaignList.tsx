'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { Campaign } from '@/services/firestore';
import Link from 'next/link';

interface CampaignListProps {
  campaigns: Campaign[];
  onStatusChange: (campaignId: string, status: Campaign['status']) => Promise<void>;
  onDelete: (campaignId: string) => Promise<void>;
}

export default function CampaignList({ campaigns, onStatusChange, onDelete }: CampaignListProps) {
  const [sortField, setSortField] = useState<keyof Campaign>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<Campaign['status'] | 'all'>('all');

  const sortedAndFilteredCampaigns = campaigns
    .filter(campaign => filter === 'all' || campaign.status === filter)
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }
      
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

  const handleSort = (field: keyof Campaign) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4" />;
      case 'scheduled':
        return <ArrowPathIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Campaign['status'] | 'all')}
            className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Campaigns</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaign List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Campaign Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th
                onClick={() => handleSort('sentCount')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Sent
              </th>
              <th
                onClick={() => handleSort('openCount')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Opens
              </th>
              <th
                onClick={() => handleSort('clickCount')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Clicks
              </th>
              <th
                onClick={() => handleSort('createdAt')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              >
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredCampaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.niche}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                    {getStatusIcon(campaign.status)}
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.sentCount?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.openCount?.toLocaleString() || 0}
                  {campaign.sentCount > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({Math.round((campaign.openCount || 0) / campaign.sentCount * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.clickCount?.toLocaleString() || 0}
                  {campaign.openCount > 0 && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({Math.round((campaign.clickCount || 0) / campaign.openCount * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/analytics`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => onStatusChange(campaign.id!, 'paused')}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <PauseIcon className="h-5 w-5" />
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => onStatusChange(campaign.id!, 'active')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    {['draft', 'completed', 'failed'].includes(campaign.status) && (
                      <button
                        onClick={() => onDelete(campaign.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 