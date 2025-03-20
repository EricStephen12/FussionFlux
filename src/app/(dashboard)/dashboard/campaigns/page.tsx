import { Suspense } from 'react';
import CampaignsClient from './CampaignsClient';
import LoadingSpinner from '@/components/LoadingSpinner';

// Force dynamic rendering for campaigns page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <CampaignsClient />
      </Suspense>
    </div>
  );
}