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
import { useResend } from '@/hooks/useResend';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { sendEmail } = useResend();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignData, templateData] = await Promise.all([
        firestoreService.getCampaign(params.id),
        sendEmail({
          to: 'example@example.com',
          subject: 'Your Subject',
          template: {}, // Replace with actual template data
        }),
      ]);

      if (!campaignData) {
        throw new Error('Campaign not found');
      }

      setCampaign(campaignData);
      setTemplates(templateData);
    } catch (error: any) {
      setError(error.message || 'Failed to load campaign');
      console.error('Error loading campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!selectedTemplate) {
      setError('Please select an email template');
      return;
    }

    try {
      setSending(true);
      const token = await user?.getIdToken();
      const response = await fetch(`/api/campaigns/${params.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send campaign');
      }

      await loadData(); // Reload campaign data
    } catch (error: any) {
      setError(error.message || 'Failed to send campaign');
      console.error('Error sending campaign:', error);
    } finally {
      setSending(false);
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Emails Sent</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">5</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Opens</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">2</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Clicks</dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">1</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Estimated ROI</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">124%</dd>
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
              <div className="mt-2 text-indigo-600">9:00 AM</div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">First Open</span>
              <div className="mt-2 text-indigo-600">9:15 AM</div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">First Click</span>
              <div className="mt-2 text-indigo-600">9:30 AM</div>
            </div>
            <div>
              <span className="bg-white px-2 text-sm text-gray-500">Latest Activity</span>
              <div className="mt-2 text-indigo-600">10:00 AM</div>
            </div>
          </div>
        </div>

        {/* Engagement Graph */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">Engagement Over Time</h3>
          <div className="mt-3 h-96 bg-gray-50 rounded-lg p-4">
            [Engagement Graph Will Render Here]
          </div>
        </div>

        {/* Action Items */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">Recommended Actions</h3>
          <ul className="mt-3 space-y-3">
            <li className="text-sm text-gray-600">
              ✓ Send follow-up to 3 opens without clicks
            </li>
            <li className="text-sm text-gray-600">
              ✓ A/B test subject line for tomorrow's batch
            </li>
            <li className="text-sm text-gray-600">
              ✓ Review click patterns for optimization
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 