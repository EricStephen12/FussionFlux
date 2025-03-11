'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/services/firestore';
import Link from 'next/link';
import { BoltIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function TrialStatus() {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState({
    daysRemaining: 0,
    usedFeatures: 0,
    totalFeatures: 0,
    trialProgress: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadTrialData() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await firestoreService.getTrialStatus(user.uid);
        setTrialData(data);
      } catch (error) {
        console.error('Error loading trial data:', error);
        setError('Failed to load your trial status. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadTrialData();
  }, [user]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <BoltIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Trial Status
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {loading ? 'Loading...' : `${trialData.daysRemaining} days remaining in your trial`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              Features Used
            </p>
            <p className="text-sm text-gray-500">
              {trialData.usedFeatures} of {trialData.totalFeatures}
            </p>
          </div>
          
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Upgrade Now
            <ChevronRightIcon className="ml-2 -mr-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                Trial Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-indigo-600">
                {trialData.trialProgress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
            <div
              style={{ width: `${trialData.trialProgress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 