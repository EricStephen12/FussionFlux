'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding() {
  const { steps, currentStep, completeStep, skipOnboarding } = useOnboarding();
  const [formData, setFormData] = useState({
    businessName: '',
    website: '',
    niche: '',
  });
  const router = useRouter();
  const { user, updateUserProfile, checkEmailVerification } = useAuth();
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Add useEffect to check email verification status periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (steps[currentStep]?.id === 'verify-email' && !steps[currentStep].completed) {
      interval = setInterval(async () => {
        try {
          const isVerified = await checkEmailVerification();
          if (isVerified) {
            await completeStep('verify-email');
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentStep, steps, checkEmailVerification, completeStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitStep = async () => {
    const currentStepData = steps[currentStep];
    
    try {
      console.log('Completing step:', currentStepData.id);
      
      switch (currentStepData.id) {
        case 'profile':
          if (!formData.businessName) {
            throw new Error('Business name is required');
          }
          await updateUserProfile(formData.businessName);
          break;
        case 'verify-email':
          if (!user?.emailVerified) {
            throw new Error('Please verify your email first');
          }
          break;
        case 'select-niche':
          if (!formData.niche) {
            throw new Error('Please select a niche');
          }
          break;
        case 'first-campaign':
          router.push('/dashboard/campaigns/new');
          break;
      }

      await completeStep(currentStepData.id);
      console.log('Step completed:', currentStepData.id);
      
      if (currentStep === steps.length - 1) {
        console.log('All steps completed, redirecting to dashboard');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error completing step:', error);
      // Show error message to user
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerificationError('');
      if (user) {
        await user.sendEmailVerification();
        // Show success message or toast
      }
    } catch (error: any) {
      setVerificationError(error.message);
    }
  };

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];

    switch (currentStepData.id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website (optional)
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );

      case 'verify-email':
        return (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              We've sent a verification email to {user?.email}. Please check your inbox and click
              the verification link.
            </p>
            {verificationError && (
              <p className="text-sm text-red-500">{verificationError}</p>
            )}
            <div className="space-x-4">
              <button
                type="button"
                onClick={() => checkEmailVerification()}
                disabled={verificationChecking}
                className="text-indigo-600 hover:text-indigo-500"
              >
                {verificationChecking ? 'Checking...' : "I've verified my email"}
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="text-gray-500 hover:text-gray-700"
              >
                Resend verification email
              </button>
            </div>
          </div>
        );

      case 'select-niche':
        return (
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700">
              Select Your Niche
            </label>
            <select
              id="niche"
              name="niche"
              value={formData.niche}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a niche</option>
              <option value="fashion">Fashion & Apparel</option>
              <option value="home">Home & Garden</option>
              <option value="electronics">Electronics & Gadgets</option>
              <option value="health">Health & Beauty</option>
              <option value="sports">Sports & Fitness</option>
              <option value="toys">Toys & Games</option>
              <option value="pets">Pet Supplies</option>
              <option value="jewelry">Jewelry & Accessories</option>
              <option value="office">Office Supplies</option>
              <option value="automotive">Automotive</option>
            </select>
          </div>
        );

      case 'first-campaign':
        return (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Ready to create your first email campaign? We'll guide you through the process.
            </p>
            <button
              type="button"
              onClick={handleSubmitStep}
              className="mt-4 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Create Campaign
              <ChevronRightIcon className="ml-2 -mr-1 h-4 w-4" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
            <button
              type="button"
              onClick={skipOnboarding}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="sr-only">Skip</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div>
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        step.completed
                          ? 'bg-indigo-600'
                          : index === currentStep
                          ? 'border-2 border-indigo-600'
                          : 'border-2 border-gray-300'
                      }`}
                    >
                      {step.completed ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={
                            index === currentStep ? 'text-indigo-600' : 'text-gray-500'
                          }
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-full ${
                          step.completed ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {steps[currentStep].title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{steps[currentStep].description}</p>

                <div className="mt-6">{renderStepContent()}</div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={skipOnboarding}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
              {steps[currentStep].id !== 'first-campaign' && (
                <button
                  type="button"
                  onClick={handleSubmitStep}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Continue
                  <ChevronRightIcon className="ml-2 -mr-1 h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 