import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { creditsService, type UserCredits } from '@/services/trial';

export default function UsageStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserCredits>({
    userId: '',
    credits: 0,
    lastPurchase: null
  });

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    const credits = await creditsService.getUserCredits(user.uid);
    setStats({
      userId: user.uid,
      credits,
      lastPurchase: null
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Credits</h2>
      
      {/* Credits Display */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Credits Available</span>
          <span className="text-lg font-bold text-indigo-600">{stats.credits.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 rounded-full h-2 transition-all duration-500"
            style={{ width: `${Math.min((stats.credits / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Credit Status */}
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
      {stats.credits < 100 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Your credits are running low. Purchase more credits to continue sending emails.
          </p>
          <a
            href="/dashboard/billing"
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Purchase Credits
          </a>
        </div>
      )}
    </div>
  );
} 