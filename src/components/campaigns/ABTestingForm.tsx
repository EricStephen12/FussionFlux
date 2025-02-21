'use client';

import { useState } from 'react';
import {
  BeakerIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Variant {
  id: string;
  name: string;
  subject: string;
  content: string;
  sendToPercent: number;
}

interface ABTestFormProps {
  onSubmit: (variants: Variant[], testDuration: number, winningCriteria: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ABTestForm({ onSubmit, isLoading = false }: ABTestFormProps) {
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: '1',
      name: 'Variant A',
      subject: '',
      content: '',
      sendToPercent: 50,
    },
    {
      id: '2',
      name: 'Variant B',
      subject: '',
      content: '',
      sendToPercent: 50,
    },
  ]);

  const [testDuration, setTestDuration] = useState(24); // hours
  const [winningCriteria, setWinningCriteria] = useState('openRate');

  const addVariant = () => {
    if (variants.length >= 4) return; // Maximum 4 variants
    const newVariant: Variant = {
      id: String(variants.length + 1),
      name: `Variant ${String.fromCharCode(65 + variants.length)}`, // A, B, C, D
      subject: '',
      content: '',
      sendToPercent: Math.floor(100 / (variants.length + 1)),
    };
    
    // Redistribute percentages
    const updatedVariants = variants.map(variant => ({
      ...variant,
      sendToPercent: Math.floor(100 / (variants.length + 1)),
    }));
    
    setVariants([...updatedVariants, newVariant]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return; // Minimum 2 variants
    const updatedVariants = variants.filter(v => v.id !== id).map((variant, index) => ({
      ...variant,
      sendToPercent: Math.floor(100 / (variants.length - 1)),
    }));
    setVariants(updatedVariants);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
    const updatedVariants = variants.map(variant =>
      variant.id === id ? { ...variant, [field]: value } : variant
    );
    setVariants(updatedVariants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(variants, testDuration, winningCriteria);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h3 className="text-lg font-medium leading-6 text-gray-900">A/B Test Configuration</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Create up to 4 variants to test different subject lines and content. The winning variant
          will be automatically selected based on your chosen criteria.
        </p>
      </div>

      {/* Variants */}
      <div className="space-y-6">
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className="bg-white shadow sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900 flex items-center">
                  <BeakerIcon className="h-5 w-5 text-gray-400 mr-2" />
                  {variant.name}
                </h4>
                {variants.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label
                    htmlFor={`subject-${variant.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject Line
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name={`subject-${variant.id}`}
                      id={`subject-${variant.id}`}
                      value={variant.subject}
                      onChange={(e) => updateVariant(variant.id, 'subject', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor={`percent-${variant.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Test Group Size (%)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name={`percent-${variant.id}`}
                      id={`percent-${variant.id}`}
                      value={variant.sendToPercent}
                      onChange={(e) => updateVariant(variant.id, 'sendToPercent', parseInt(e.target.value))}
                      min="1"
                      max="100"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label
                    htmlFor={`content-${variant.id}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Content
                  </label>
                  <div className="mt-1">
                    <textarea
                      id={`content-${variant.id}`}
                      name={`content-${variant.id}`}
                      rows={4}
                      value={variant.content}
                      onChange={(e) => updateVariant(variant.id, 'content', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {variants.length < 4 && (
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Variant
          </button>
        )}
      </div>

      {/* Test Configuration */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
            Test Configuration
          </h4>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label
                htmlFor="test-duration"
                className="block text-sm font-medium text-gray-700"
              >
                Test Duration (hours)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="test-duration"
                  id="test-duration"
                  value={testDuration}
                  onChange={(e) => setTestDuration(parseInt(e.target.value))}
                  min="1"
                  max="168"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="winning-criteria"
                className="block text-sm font-medium text-gray-700"
              >
                Winning Criteria
              </label>
              <div className="mt-1">
                <select
                  id="winning-criteria"
                  name="winning-criteria"
                  value={winningCriteria}
                  onChange={(e) => setWinningCriteria(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="openRate">Open Rate</option>
                  <option value="clickRate">Click Rate</option>
                  <option value="conversionRate">Conversion Rate</option>
                  <option value="revenue">Revenue Generated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Creating Test...' : 'Start A/B Test'}
        </button>
      </div>
    </form>
  );
} 