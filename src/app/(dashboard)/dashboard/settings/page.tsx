'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { SettingsService } from '@/services/settings';
import { useResend } from '@/hooks/useResend';

export default function SettingsPage() {
  const { user } = useAuth();
  const { sendEmail } = useResend();
  const settingsService = new SettingsService();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: true,
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const userSettings = await settingsService.getUserSettings(user!.uid);
        setSettings(userSettings);
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
  }, [user]);

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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              defaultValue={user?.displayName || ''}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              defaultValue={user?.email || ''}
              disabled
            />
            <p className="mt-1 text-sm text-gray-500">
              Your email address is verified and cannot be changed.
            </p>
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
    </div>
  );
}