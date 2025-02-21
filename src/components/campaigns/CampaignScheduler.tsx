'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  ArrowPathIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

interface ScheduleConfig {
  type: 'immediate' | 'scheduled' | 'recurring';
  datetime?: Date;
  timezone: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];  // For weekly: 0-6 (Sunday-Saturday), For monthly: 1-31
    time: string;     // HH:mm format
    endDate?: Date;
  };
}

interface CampaignSchedulerProps {
  initialConfig?: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
}

export default function CampaignScheduler({
  initialConfig,
  onChange,
}: CampaignSchedulerProps) {
  const [config, setConfig] = useState<ScheduleConfig>(
    initialConfig || {
      type: 'immediate',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  );

  const handleConfigChange = (updates: Partial<ScheduleConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  const handleRecurringChange = (updates: Partial<ScheduleConfig['recurring']>) => {
    const newConfig = {
      ...config,
      recurring: {
        ...config.recurring,
        ...updates,
      },
    };
    setConfig(newConfig);
    onChange(newConfig);
  };

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {/* Schedule Type */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Campaign Schedule</h3>
        <div className="mt-4 space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={config.type === 'immediate'}
              onChange={() => handleConfigChange({ type: 'immediate' })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Send immediately
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              checked={config.type === 'scheduled'}
              onChange={() => handleConfigChange({
                type: 'scheduled',
                datetime: new Date(Date.now() + 3600000), // Default to 1 hour from now
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Schedule for later
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="radio"
              checked={config.type === 'recurring'}
              onChange={() => handleConfigChange({
                type: 'recurring',
                recurring: {
                  frequency: 'weekly',
                  days: [1], // Monday
                  time: '09:00',
                },
              })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Set up recurring schedule
            </span>
          </label>
        </div>
      </div>

      {/* Timezone Selection */}
      <div className="p-6">
        <div className="flex items-center">
          <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
          <label className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
        </div>
        <select
          value={config.timezone}
          onChange={(e) => handleConfigChange({ timezone: e.target.value })}
          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          {Intl.supportedValuesOf('timeZone').map(tz => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Schedule Details */}
      {config.type === 'scheduled' && (
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date and Time
              </label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="date"
                    value={config.datetime ? format(config.datetime, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const currentTime = config.datetime || new Date();
                      date.setHours(currentTime.getHours(), currentTime.getMinutes());
                      handleConfigChange({ datetime: date });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={config.datetime ? format(config.datetime, 'HH:mm') : ''}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const date = config.datetime || new Date();
                      date.setHours(hours, minutes);
                      handleConfigChange({ datetime: date });
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <ClockIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Schedule Details */}
      {config.type === 'recurring' && config.recurring && (
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                value={config.recurring.frequency}
                onChange={(e) => handleRecurringChange({
                  frequency: e.target.value as ScheduleConfig['recurring']['frequency'],
                  days: e.target.value === 'weekly' ? [1] : e.target.value === 'monthly' ? [1] : undefined,
                })}
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {config.recurring.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Days of Week
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <label
                      key={day}
                      className="inline-flex items-center"
                    >
                      <input
                        type="checkbox"
                        checked={config.recurring?.days?.includes(index)}
                        onChange={(e) => {
                          const days = config.recurring?.days || [];
                          const newDays = e.target.checked
                            ? [...days, index]
                            : days.filter(d => d !== index);
                          handleRecurringChange({ days: newDays });
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {config.recurring.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Day of Month
                </label>
                <select
                  value={config.recurring.days?.[0] || 1}
                  onChange={(e) => handleRecurringChange({
                    days: [parseInt(e.target.value)],
                  })}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Time
              </label>
              <div className="mt-2 relative">
                <input
                  type="time"
                  value={config.recurring.time}
                  onChange={(e) => handleRecurringChange({ time: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <ClockIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date (Optional)
              </label>
              <div className="mt-2 relative">
                <input
                  type="date"
                  value={config.recurring.endDate ? format(config.recurring.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleRecurringChange({
                    endDate: e.target.value ? new Date(e.target.value) : undefined,
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 