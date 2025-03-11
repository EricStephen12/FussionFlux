import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { fetchUsedEmails, fetchUsedSMS } from '../../services/api'; // Assuming these functions exist

const UsageStats: React.FC = () => {
  const { subscription } = useSubscription();
  const [usedEmails, setUsedEmails] = useState<number>(0);
  const [usedSMS, setUsedSMS] = useState<number>(0);

  useEffect(() => {
    const getUsedEmails = async () => {
      try {
        const emails: number = await fetchUsedEmails();
        setUsedEmails(emails);
      } catch (error) {
        console.error('Error fetching used emails:', error);
      }
    };
    getUsedEmails();
  }, []);

  useEffect(() => {
    const getUsedSMS = async () => {
      try {
        const sms: number = await fetchUsedSMS();
        setUsedSMS(sms);
      } catch (error) {
        console.error('Error fetching used SMS:', error);
      }
    };
    getUsedSMS();
  }, []);

  return (
    <div>
      <h2>Usage Stats</h2>
      <p>Emails Sent: {usedEmails} / {subscription.maxEmails}</p>
      <p>SMS Sent: {usedSMS} / {subscription.maxSMS}</p>
    </div>
  );
};

export default UsageStats; 