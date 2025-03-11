import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { creditsService, type UserLimits } from '@/services/trial';

export default function UsageStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserLimits>({
    userId: '',
    limits: 0,
    lastPurchase: null
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const limitsData = await creditsService.getUserLimits(user.uid);
      const lastPurchaseDate = await creditsService.getLastPurchaseDate(user.uid);
      setStats({
        userId: user.uid,
        limits: limitsData,
        lastPurchase: lastPurchaseDate
      });
    } catch (error) {
      console.error('Error loading user limits:', error);
      setError('Failed to load your limits. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Limits</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {/* Limits Display */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Limits Available</span>
          <span className="text-lg font-bold text-indigo-600">{stats.limits.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 rounded-full h-2 transition-all duration-500"
            style={{ width: `${Math.min((stats.limits / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Limit Status */}
      <div className="space-y-3">
        {stats.lastPurchase && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Last Purchase</span>
            <span className="text-gray-900">
              {new Date(stats.lastPurchase).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Warning Messages */}
      {stats.limits < 50 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            Critical: Your limits are critically low. Please purchase more limits immediately.
          </p>
          <a
            href="/dashboard/billing"
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Purchase Limits
          </a>
        </div>
      )}
      {stats.limits < 100 && stats.limits >= 50 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Warning: Your limits are running low. Purchase more limits to continue sending emails.
          </p>
          <a
            href="/dashboard/billing"
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Purchase Limits
          </a>
        </div>
      )}
      {stats.limits < 200 && stats.limits >= 100 && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
          <p className="text-sm text-yellow-800">
            Notice: You have less than 200 limits remaining. Consider purchasing more soon.
          </p>
        </div>
      )}
    </div>
  );
} 