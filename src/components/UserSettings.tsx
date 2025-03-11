import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import CustomDomainManager from '@/components/CustomDomainManager';

const UserSettings: React.FC = () => {
  const { subscription } = useSubscription();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Settings</h1>
      {/* Other settings components */}

      {/* Render Custom Domain Manager for Pro and Grower users */}
      {subscription && (subscription.tier === 'pro' || subscription.tier === 'growth') && (
        <CustomDomainManager />
      )}
    </div>
  );
};

export default UserSettings; 