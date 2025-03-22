import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { fetchUsedEmails, fetchUsedSMS } from '../../services/api';

const UsageStats: React.FC = () => {
  const { subscription } = useSubscription();
  const [usedEmails, setUsedEmails] = useState<number>(0);
  const [usedSMS, setUsedSMS] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUsedEmails = async () => {
      try {
        const emails: number = await fetchUsedEmails();
        setUsedEmails(emails);
      } catch (error) {
        console.error('Error fetching used emails:', error);
        setError('Failed to fetch email usage data');
      }
    };

    if (subscription) {
      getUsedEmails();
    }
  }, [subscription]);

  useEffect(() => {
    const getUsedSMS = async () => {
      try {
        const sms: number = await fetchUsedSMS();
        setUsedSMS(sms);
      } catch (error) {
        console.error('Error fetching used SMS:', error);
        setError('Failed to fetch SMS usage data');
      } finally {
        setLoading(false);
      }
    };

    if (subscription) {
      getUsedSMS();
    } else {
      setLoading(false);
    }
  }, [subscription]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-medium">Error Loading Usage Stats</h2>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h2 className="text-yellow-800 text-lg font-medium">No Active Subscription</h2>
          <p className="text-yellow-700 mt-2">Please subscribe to a plan to view usage statistics.</p>
        </div>
      </div>
    );
  }

  const maxEmails = subscription.maxEmails || Infinity;
  const maxSMS = subscription.maxSMS || Infinity;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Usage Stats</h2>
      <div className="space-y-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Email Usage</h3>
          <p>Emails Sent: {usedEmails} / {maxEmails === Infinity ? 'Unlimited' : maxEmails}</p>
          {maxEmails !== Infinity && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((usedEmails / maxEmails) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">SMS Usage</h3>
          <p>SMS Sent: {usedSMS} / {maxSMS === Infinity ? 'Unlimited' : maxSMS}</p>
          {maxSMS !== Infinity && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((usedSMS / maxSMS) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageStats; 