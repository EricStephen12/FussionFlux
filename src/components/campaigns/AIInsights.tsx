import { useState, useEffect } from 'react';
import { firestoreService } from '@/services/firestore';
import { AIOptimizationMetrics } from '@/services/ai-optimization';
import { ChartBarIcon, LightBulbIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AIInsightsProps {
  campaignId: string;
}

export default function AIInsights({ campaignId }: AIInsightsProps) {
  const [metrics, setMetrics] = useState<AIOptimizationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await firestoreService.getDocument('ai_metrics', campaignId);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading AI metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <LightBulbIcon className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
      </div>
      
      {metrics ? (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-600 font-medium">Lead Score</div>
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-700">
                {metrics.leadScore}%
              </div>
              <div className="mt-1 text-sm text-blue-500">
                Likelihood of engagement
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-green-600" />
                <div className="text-sm text-green-600 font-medium">Content Score</div>
              </div>
              <div className="mt-2 text-2xl font-bold text-green-700">
                {(metrics.contentScore * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-sm text-green-500">
                Content optimization level
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-purple-600" />
                <div className="text-sm text-purple-600 font-medium">Send Time Score</div>
              </div>
              <div className="mt-2 text-2xl font-bold text-purple-700">
                {(metrics.sendTimeScore * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-sm text-purple-500">
                Timing optimization score
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">AI Recommendations</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {metrics.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <LightBulbIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-xs text-gray-500 mt-4">
            Last updated: {new Date(metrics.optimizationDate).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <LightBulbIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p>No AI insights available yet</p>
          <p className="text-sm mt-1">Send your campaign to generate AI-powered analytics</p>
        </div>
      )}
    </div>
  );
} 