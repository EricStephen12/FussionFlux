import { Suspense } from 'react';
import { db } from '@/utils/firebase-admin';
import CampaignClient from './CampaignClient';
import LoadingSpinner from '@/components/LoadingSpinner';

// Force dynamic rendering for campaign pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate static params for the most recent campaigns
export async function generateStaticParams() {
  try {
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.get();
    const campaigns = [];
    
    snapshot.forEach((doc) => {
      // Only pre-render the most recent 20 campaigns
      if (campaigns.length < 20) {
        campaigns.push({ id: doc.id });
      }
    });
    
    return campaigns;
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function CampaignPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <CampaignClient id={params.id} />
      </Suspense>
    </div>
  );
} 