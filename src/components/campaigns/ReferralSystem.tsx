import React, { useState } from 'react';

const ReferralSystem: React.FC = () => {
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateReferralLink = () => {
    // Generate a referral link (this would typically involve an API call)
    const link = `https://example.com/referral?code=${Math.random().toString(36).substring(2, 15)}`;
    setReferralLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold">Referral System</h2>
      <p className="mt-2 text-sm text-gray-500">Invite others to join the platform and earn rewards!</p>
      <button onClick={generateReferralLink} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Generate Referral Link
      </button>
      {referralLink && (
        <div className="mt-4">
          <input type="text" value={referralLink} readOnly className="w-full p-2 border rounded" />
          <button onClick={copyToClipboard} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem; 