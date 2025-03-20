'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditTemplateRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    // Redirect to campaigns with the template ID
    if (id) {
      router.push(`/dashboard/campaigns?template=${id}`);
    } else {
      router.push('/dashboard/campaigns');
    }
  }, [router, id]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Redirecting to campaigns...</p>
      </div>
    </div>
  );
} 