// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  BellIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { SettingsService } from '@/services/settings';
import { useResend } from '@/hooks/useResend';
import { useSubscription } from '@/hooks/useSubscription';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { firestoreService } from '@/services/firestore';

export default function SettingsPage() {
  const { user } = useAuth();
  const { sendEmail } = useResend();
  const { subscription, checkFeatureAccess } = useSubscription();
  const settingsService = new SettingsService();
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    company: '',
    title: '',
  });
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: true,
  });
  
  const [customDomain, setCustomDomain] = useState({
    domain: '',
    verified: false,
    status: 'not_configured', // 'not_configured', 'pending_verification', 'verified', 'error'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const hasCustomDomainAccess = checkFeatureAccess('customDomain');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const userSettings = await settingsService.getUserSettings(user!.uid);
        setSettings(userSettings);
        
        setProfileForm({
          fullName: user?.displayName || '',
          company: userSettings?.company || '',
          title: userSettings?.title || '',
        });
        
        // Load custom domain settings if the user has access to this feature
        if (hasCustomDomainAccess) {
          try {
            const domainData = await settingsService.getCustomDomainSettings(user!.uid);
            if (domainData) {
              setCustomDomain(domainData);
            }
          } catch (domainError) {
            console.error('Error loading domain settings:', domainError);
            // Don't show error, just use default state
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user, hasCustomDomainAccess]);

  const handleToggle = async (setting: keyof typeof settings) => {
    try {
      setError('');
      setSuccess('');
      
      const updatedSettings = {
        ...settings,
        [setting]: !settings[setting],
      };

      // Store the previous settings in case we need to revert
      const previousSettings = { ...settings };
      
      // Optimistically update the UI
      setSettings(updatedSettings);

      // Update settings in Firestore and Resend
      const result = await settingsService.updateUserSettings(user!.uid, updatedSettings);
      
      if (result.success) {
        // Send confirmation email using useResend
        if (setting === 'emailNotifications' || setting === 'marketingEmails') {
          try {
            await sendEmail({
              to: user!.email!,
              subject: 'Notification Settings Updated',
              template: {
                name: 'Settings Update',
                blocks: [
                  {
                    type: 'text',
                    content: {
                      text: `Your notification settings have been updated. ${setting === 'emailNotifications' ? 
                        `Email notifications are now ${updatedSettings.emailNotifications ? 'enabled' : 'disabled'}.` :
                        `Marketing emails are now ${updatedSettings.marketingEmails ? 'enabled' : 'disabled'}.`}`,
                      fontSize: '16px',
                      color: '#374151'
                    }
                  }
                ]
              }
            });
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't show error to user as the settings were still updated successfully
          }
        }
        
        setSuccess('Settings updated successfully');
      } else {
        // If update failed, revert to previous settings
        setSettings(previousSettings);
        setError(result.message);
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      // Revert to previous settings
      setSettings(settings);
      setError(error.message || 'Failed to update settings');
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update profile in Firebase Auth and Firestore
      const result = await settingsService.updateUserProfile(user!.uid, profileForm);
      
      if (result.success) {
        setSuccess('Profile updated successfully');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDomain(prev => ({
      ...prev,
      domain: e.target.value,
      status: 'not_configured',
      verified: false
    }));
  };

  const handleVerifyDomain = async () => {
    if (!customDomain.domain) {
      setError('Please enter a domain name');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Update domain status to pending
      setCustomDomain(prev => ({
        ...prev,
        status: 'pending_verification'
      }));

      // Request domain verification from backend
      const result = await settingsService.verifyCustomDomain(user!.uid, customDomain.domain);
      
      if (result.success) {
        setCustomDomain(prev => ({
          ...prev,
          status: 'verified',
          verified: true
        }));
        setSuccess('Domain verified successfully');
      } else {
        setCustomDomain(prev => ({
          ...prev,
          status: 'error'
        }));
        setError(result.message || 'Failed to verify domain');
      }
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      setCustomDomain(prev => ({
        ...prev,
        status: 'error'
      }));
      setError(error.message || 'Failed to verify domain');
    } finally {
      setSaving(false);
    }
  };

  // Add this new function to enable admin access
  const enableAdminAccess = async () => {
    if (!user) return;
    
    try {
      // Reference to the user document
      const userRef = doc(firestoreService.db, 'users', user.uid);
      
      // Update the user document to add admin role
      await updateDoc(userRef, {
        isAdmin: true,
        adminSince: new Date().toISOString()
      });
      
      toast.success('Admin access enabled! Please refresh the page.');
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error enabling admin access:', error);
      toast.error('Failed to enable admin access');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <UserCircleIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={profileForm.fullName}
              onChange={handleProfileChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={profileForm.company}
              onChange={handleProfileChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={profileForm.title}
              onChange={handleProfileChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Your job title"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
              defaultValue={user?.email || ''}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Your email address is verified and cannot be changed.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive notifications about your campaigns and leads
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emailNotifications')}
              className={`${
                settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
              <p className="text-sm text-gray-500">
                Receive updates about new features and promotions
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('marketingEmails')}
              className={`${
                settings.marketingEmails ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.marketingEmails ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Domain Settings - Only show for Growth and Pro tiers */}
      {hasCustomDomainAccess && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center space-x-3 mb-6">
            <GlobeAltIcon className="h-8 w-8 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">Custom Domain</h2>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Configure a custom domain for your campaigns. Your Growth or Pro plan includes one free custom domain.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-grow">
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                  Domain Name
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="domain"
                    id="domain"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                    placeholder="yourdomain.com"
                    value={customDomain.domain}
                    onChange={handleDomainChange}
                    disabled={customDomain.verified}
                  />
                </div>
              </div>
              
              <div className="mt-6 sm:mt-0">
                {customDomain.verified ? (
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 cursor-not-allowed"
                    disabled
                  >
                    <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                    Verified
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyDomain}
                    disabled={!customDomain.domain || saving || customDomain.status === 'pending_verification'}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {customDomain.status === 'pending_verification' ? (
                      <>
                        <span className="animate-pulse">Verifying...</span>
                      </>
                    ) : (
                      'Verify Domain'
                    )}
                  </button>
                )}
              </div>
            </div>

            {customDomain.status === 'error' && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Domain verification failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Please ensure that you've added the required DNS records. Visit our{' '}
                        <a href="/docs" className="font-medium underline">
                          documentation
                        </a>{' '}
                        for detailed setup instructions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {customDomain.verified && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Domain verified successfully</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your custom domain is now configured and ready to use for your campaigns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!customDomain.verified && customDomain.domain && customDomain.status !== 'error' && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">DNS Configuration Instructions</h3>
                <p className="text-sm text-gray-600 mb-4">
                  To verify your domain, add the following DNS records to your domain settings:
                </p>
                <div className="bg-white overflow-x-auto rounded border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TTL
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">CNAME</td>
                        <td className="px-4 py-2 text-sm text-gray-500">email</td>
                        <td className="px-4 py-2 text-sm text-gray-500">mail.dropshipemail.com</td>
                        <td className="px-4 py-2 text-sm text-gray-500">3600</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-900">TXT</td>
                        <td className="px-4 py-2 text-sm text-gray-500">@</td>
                        <td className="px-4 py-2 text-sm text-gray-500">v=spf1 include:_spf.dropshipemail.com ~all</td>
                        <td className="px-4 py-2 text-sm text-gray-500">3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add this at the end of your JSX, before the final closing div */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Developer Settings</h3>
          <div className="mt-4">
            <button
              type="button"
              onClick={enableAdminAccess}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enable Admin Access
            </button>
            <p className="mt-2 text-sm text-gray-500">
              This button is only visible in development mode and will grant admin privileges to your account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}