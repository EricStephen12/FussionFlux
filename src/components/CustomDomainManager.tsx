import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useResend } from '@/hooks/useResend';

const CustomDomainManager: React.FC = () => {
  const { user } = useAuth();
  const [customDomain, setCustomDomain] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const resend = useResend();

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDomain(e.target.value);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // Validate the custom domain format
      const domainPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/;
      if (!domainPattern.test(customDomain)) {
        setError('Please enter a valid domain.');
        return;
      }

      // Update the custom domain in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { customDomain });
      setSuccess('Custom domain updated successfully!');
      setError(null);
    } catch (err) {
      setError('Failed to update custom domain. Please try again.');
      setSuccess(null);
      resend();
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Manage Your Custom Domain</h2>
      <input
        type="text"
        value={customDomain}
        onChange={handleDomainChange}
        placeholder="Enter your custom domain"
        className="mt-2 p-2 border rounded w-full"
      />
      <button
        onClick={handleSave}
        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Save Domain
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </div>
  );
};

export default CustomDomainManager; 