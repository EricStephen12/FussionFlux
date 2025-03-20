'use client';

import { useState, useEffect } from 'react';

interface AIInsightsProps {
  campaignId: string;
}

export function AIInsights({ campaignId }: AIInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Implement actual AI insights fetching
    setLoading(false);
    setInsights([
      'Campaign is performing well compared to industry standards',
      'Open rate is above average for your industry',
      'Consider A/B testing subject lines for better engagement'
    ]);
  }, [campaignId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-white shadow rounded-lg p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">AI Campaign Insights</h2>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-gray-600">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 