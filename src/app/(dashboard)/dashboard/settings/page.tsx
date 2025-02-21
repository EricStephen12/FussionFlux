'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { SettingsService } from '@/services/settings';

export default function SettingsPage() {
  const { user } = useAuth();
  const settingsService = new SettingsService();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: true,
    twoFactorEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const userSettings = await settingsService.getUserSettings(user!.uid);
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user]);

  const handleToggle = async (setting: keyof typeof settings) => {
    const updatedSettings = {
      ...settings,
      [setting]: !settings[setting],
    };
    setSettings(updatedSettings);

    try {
      await settingsService.updateUserSettings(user!.uid, updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
        <div className="flex items-center space-x-3 mb-6">
          <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
          <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('twoFactorEnabled')}
              className={`${
                settings.twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="pt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <KeyIcon className="h-5 w-5 mr-2 text-gray-500" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}