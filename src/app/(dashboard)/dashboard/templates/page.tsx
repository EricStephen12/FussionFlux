'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TemplatesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to campaigns page
    router.push('/dashboard/campaigns');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Redirecting to campaigns...</p>
      </div>
    </div>
  );
} 