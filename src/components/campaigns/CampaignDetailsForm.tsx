'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  EnvelopeIcon, 
  UserIcon, 
  ArrowRightIcon,
  BeakerIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatDistanceToNow } from 'date-fns';

interface CampaignDetailsFormProps {
  details: {
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    scheduledDate: Date;
    sendImmediately: boolean;
    subjectB?: string;
    enableABTesting?: boolean;
    testRatio?: number;
    testWinnerMetric?: 'open' | 'click';
    testDuration?: number;
  };
  onChange: (details: any) => void;
  onNext: () => void;
}

export default function CampaignDetailsForm({ 
  details, 
  onChange, 
  onNext 
}: CampaignDetailsFormProps) {
  const { subscription } = useSubscription();
  const [formValues, setFormValues] = useState(details);
  const [abTestingSupported, setAbTestingSupported] = useState(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  
  // Check if A/B testing is available in the user's subscription
  useEffect(() => {
    if (subscription) {
      setAbTestingSupported(subscription.features?.abTesting || false);
      
      // If A/B testing is not supported, disable it
      if (!subscription.features?.abTesting && formValues.enableABTesting) {
        setFormValues({
          ...formValues,
          enableABTesting: false
        });
        onChange({
          ...formValues,
          enableABTesting: false
        });
      }
    }
  }, [subscription]);
  
  // Generate subject line suggestions based on dropshipping best practices
  useEffect(() => {
    if (formValues.name) {
      const suggestions = [
        `🔥 Limited Time: ${formValues.name}`,
        `Just Restocked: ${formValues.name}`,
        `⚡️ Flash Sale on ${formValues.name}`,
        `Don't Miss Out: ${formValues.name} is Trending`,
        `FREE Shipping on ${formValues.name} Today Only`
      ];
      setSubjectSuggestions(suggestions);
    }
  }, [formValues.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    const updatedValues = {
      ...formValues,
      [name]: newValue
    };
    
    setFormValues(updatedValues);
    onChange(updatedValues);
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scheduledDate = new Date(e.target.value);
    const updatedValues = {
      ...formValues,
      scheduledDate,
      sendImmediately: false
    };
    
    setFormValues(updatedValues);
    onChange(updatedValues);
  };
  
  const handleSendImmediatelyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sendImmediately = e.target.checked;
    const updatedValues = {
      ...formValues,
      sendImmediately
    };
    
    setFormValues(updatedValues);
    onChange(updatedValues);
  };
  
  const toggleABTesting = () => {
    if (!abTestingSupported) {
      alert('A/B testing is only available in Premium and Pro plans. Please upgrade your subscription to access this feature.');
      return;
    }
    
    const enableABTesting = !formValues.enableABTesting;
    const updatedValues = {
      ...formValues,
      enableABTesting,
      subjectB: enableABTesting ? formValues.subjectB || '' : undefined,
      testRatio: enableABTesting ? formValues.testRatio || 50 : undefined,
      testWinnerMetric: enableABTesting ? formValues.testWinnerMetric || 'open' : undefined,
      testDuration: enableABTesting ? formValues.testDuration || 4 : undefined
    };
    
    setFormValues(updatedValues);
    onChange(updatedValues);
  };
  
  const useSubjectSuggestion = (suggestion: string, isVariantB = false) => {
    const field = isVariantB ? 'subjectB' : 'subject';
    const updatedValues = {
      ...formValues,
      [field]: suggestion
    };
    
    setFormValues(updatedValues);
    onChange(updatedValues);
  };
  
  // Validation function
  const isFormValid = () => {
    if (!formValues.name || !formValues.subject || !formValues.fromName || !formValues.fromEmail) {
      return false;
    }
    
    if (formValues.enableABTesting && !formValues.subjectB) {
      return false;
    }
    
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Campaign Details
        </h3>
        
        <div className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formValues.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Spring Sale 2023"
            />
          </div>
          
          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Line
              </label>
              
              {abTestingSupported && (
                <button
                  type="button"
                  onClick={toggleABTesting}
                  className={`flex items-center text-sm px-2 py-1 rounded ${
                    formValues.enableABTesting 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <BeakerIcon className="h-4 w-4 mr-1" />
                  A/B Test
                </button>
              )}
            </div>
            
            <input
              type="text"
              id="subject"
              name="subject"
              value={formValues.subject}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter email subject line"
            />
            
            {/* Subject Suggestions */}
            {subjectSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Subject line suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {subjectSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => useSubjectSuggestion(suggestion)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* A/B Testing Section */}
            {formValues.enableABTesting && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="bg-indigo-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-indigo-700">
                    A/B testing will send two different subject lines to a portion of your audience. 
                    The winning version will be sent to the rest of your audience after the test period.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="subjectB" className="block text-sm font-medium text-gray-700 mb-1">
                      Alternative Subject Line (B)
                    </label>
                    <input
                      type="text"
                      id="subjectB"
                      name="subjectB"
                      value={formValues.subjectB || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter alternative subject line"
                    />
                    
                    {/* Subject B Suggestions */}
                    {subjectSuggestions.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {subjectSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => useSubjectSuggestion(suggestion, true)}
                              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="testRatio" className="block text-sm font-medium text-gray-700 mb-1">
                        Test Size (%)
                      </label>
                      <select
                        id="testRatio"
                        name="testRatio"
                        value={formValues.testRatio || 50}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={10}>10% of audience</option>
                        <option value={20}>20% of audience</option>
                        <option value={30}>30% of audience</option>
                        <option value={50}>50% of audience</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="testWinnerMetric" className="block text-sm font-medium text-gray-700 mb-1">
                        Success Metric
                      </label>
                      <select
                        id="testWinnerMetric"
                        name="testWinnerMetric"
                        value={formValues.testWinnerMetric || 'open'}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="open">Open Rate</option>
                        <option value="click">Click Rate</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="testDuration" className="block text-sm font-medium text-gray-700 mb-1">
                        Test Duration
                      </label>
                      <select
                        id="testDuration"
                        name="testDuration"
                        value={formValues.testDuration || 4}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={2}>2 Hours</option>
                        <option value={4}>4 Hours</option>
                        <option value={8}>8 Hours</option>
                        <option value={24}>24 Hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sender Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 mb-1">
                From Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="fromName"
                  name="fromName"
                  value={formValues.fromName}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your Name or Company"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 mb-1">
                From Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="fromEmail"
                  name="fromEmail"
                  value={formValues.fromEmail}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
          
          {/* Scheduling */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              When to send
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendImmediately"
                  name="sendImmediately"
                  checked={formValues.sendImmediately}
                  onChange={handleSendImmediatelyChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="sendImmediately" className="ml-2 block text-sm text-gray-700">
                  Send immediately after creation
                </label>
              </div>
              
              {!formValues.sendImmediately && (
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule for later
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="datetime-local"
                      id="scheduledDate"
                      name="scheduledDate"
                      value={formValues.scheduledDate.toISOString().slice(0, 16)}
                      onChange={handleDateChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  {formValues.scheduledDate && (
                    <p className="mt-1 text-sm text-gray-500">
                      Campaign will be sent {formatDistanceToNow(formValues.scheduledDate, { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Dropshipping-specific Tips for Increased Conversions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-700 mb-2">💡 Tips for High-Converting Campaigns</h4>
            <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
              <li>Include scarcity words like "Limited", "Exclusive", or "Only Today" in subject lines</li>
              <li>Personalize content with recipient's name to increase open rates by up to 26%</li>
              <li>Optimal send time for dropshipping: Tuesday-Thursday between 10am-2pm</li>
              <li>Use emojis in subject lines for 56% higher open rates</li>
              <li>A/B testing different subject lines can improve conversion by 20-30%</li>
            </ul>
          </div>
          
          {/* Subscription Limit Warning */}
          {subscription && (
            <div className="text-sm">
              <p className="text-gray-600">
                Email credits available: <span className="font-medium">{subscription.maxEmails}</span>
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onNext}
            disabled={!isFormValid()}
            className={`flex items-center px-4 py-2 rounded-lg text-white ${
              isFormValid()
                ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 