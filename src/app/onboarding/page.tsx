'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { CheckIcon, ArrowRightIcon, EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EmailVerificationService } from '@/services/email-verification';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { steps, currentStep, completeStep, isOnboardingComplete } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    website: '',
    niche: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isOnboardingComplete) {
      router.push('/dashboard');
    }
    
    setIsLoading(false);
  }, [user, isOnboardingComplete, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (stepId: string): boolean => {
    setErrors({});
    
    switch (stepId) {
      case 'profile':
        if (!formData.businessName.trim()) {
          setErrors({ businessName: 'Business name is required' });
          return false;
        }
        if (formData.website && !formData.website.startsWith('http')) {
          setErrors({ website: 'Website must start with http:// or https://' });
          return false;
        }
        return true;

      case 'select-niche':
        if (!formData.niche) {
          setErrors({ niche: 'Please select a niche' });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleStepComplete = async (stepId: string) => {
    if (!validateStep(stepId)) return;

    try {
      setIsLoading(true);
      await completeStep(stepId);
      
      // If this was the last step, redirect to dashboard
      if (currentStep === (steps?.length ?? 0) - 1) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.businessName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Your Business Name"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
              )}
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://your-store.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website}</p>
              )}
            </div>
          </div>
        );

      case 'verify-email':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verify Your Email</h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  To ensure the security of your account and enable all features, we need to verify your email address.
                </p>
                <div className={`rounded-lg p-4 ${
                  user?.emailVerified 
                    ? 'bg-green-50 border border-green-100' 
                    : 'bg-indigo-50 border border-indigo-100'
                }`}>
                  <p className={`text-sm ${user?.emailVerified ? 'text-green-700' : 'text-indigo-700'}`}>
                    Current email: <strong>{user?.email}</strong>
                  </p>
                  <p className={`text-sm mt-1 ${user?.emailVerified ? 'text-green-700' : 'text-indigo-700'}`}>
                    Status: <strong>{user?.emailVerified ? 'Verified ✓' : 'Not Verified'}</strong>
                  </p>
                </div>

                <div className="flex flex-col space-y-3">
                  {!user?.emailVerified && (
                    <button
                      onClick={async () => {
                        try {
                          await EmailVerificationService.sendVerificationEmail(
                            user?.email || '',
                            user?.displayName || ''
                          );
                          alert('Verification email sent! Please check your inbox and spam folder.');
                        } catch (error: any) {
                          console.error('Error sending verification email:', error);
                          alert(error.message || 'Failed to send verification email');
                        }
                      }}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Send Verification Email
                      <EnvelopeIcon className="ml-2 h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      try {
                        await user?.reload();
                        if (user?.emailVerified) {
                          await handleStepComplete('verify-email');
                        } else {
                          alert('Email not yet verified. Please check your email and click the verification link.');
                        }
                      } catch (error: any) {
                        console.error('Error checking verification status:', error);
                        alert(error.message || 'Failed to check verification status');
                      }
                    }}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
                      user?.emailVerified
                        ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {user?.emailVerified ? 'Continue' : 'Check Verification Status'}
                    {user?.emailVerified ? (
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowPathIcon className="ml-2 h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'select-niche':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="niche" className="block text-sm font-medium text-gray-700">
                Select Your Niche <span className="text-red-500">*</span>
              </label>
              <select
                id="niche"
                name="niche"
                value={formData.niche}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors.niche ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a niche</option>
                <option value="fashion">Fashion & Apparel</option>
                <option value="electronics">Electronics & Gadgets</option>
                <option value="home">Home & Garden</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="health">Health & Wellness</option>
                <option value="sports">Sports & Fitness</option>
                <option value="jewelry">Jewelry & Accessories</option>
                <option value="toys">Toys & Games</option>
                <option value="pets">Pet Supplies</option>
                <option value="other">Other</option>
              </select>
              {errors.niche && (
                <p className="mt-1 text-sm text-red-600">{errors.niche}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-center text-gray-600">No onboarding steps found.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.completed
                      ? 'bg-green-600 border-green-600'
                      : index === currentStep
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-gray-300 text-gray-300'
                  }`}>
                    {step.completed ? (
                      <CheckIcon className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 mx-2 ${
                      step.completed ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h2 className="text-center text-xl font-semibold text-gray-900">
                {currentStepData?.title || 'Loading...'}
              </h2>
              <p className="mt-1 text-center text-sm text-gray-600">
                {currentStepData?.description || 'Please wait...'}
              </p>
            </div>
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-end">
            {currentStepData && (
              <button
                onClick={() => handleStepComplete(currentStepData.id)}
                disabled={isLoading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  currentStep === steps.length - 1 ? 'Complete' : 'Continue'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 