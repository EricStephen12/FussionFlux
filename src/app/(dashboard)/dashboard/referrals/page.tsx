'use client';

import ReferralSystem from '@/components/campaigns/ReferralSystem';

export default function ReferralsPage() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Referral Program</h1>
        <div className="mt-8">
          <ReferralSystem />
        </div>
      </div>
    </div>
  );
}
