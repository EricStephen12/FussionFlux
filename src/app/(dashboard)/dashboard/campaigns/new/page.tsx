// @ts-nocheck

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import TemplateSelector from '@/components/campaigns/TemplateSelector';
import CampaignScheduler, { ScheduleConfig } from '@/components/campaigns/CampaignScheduler';
import AudienceSelector from '@/components/campaigns/AudienceSelector';
import { useResend } from '../../../../../hooks/useResend';
import { FirestoreService, type Campaign } from '../../../../../services/firestore';
import { creditsService } from '../../../../../services/trial';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'react-hot-toast';

import Modal from '@/components/Modal';

interface FollowUpEmail {
  templateId: string;
  name: string;
  delay: number;
  condition: {
    type: 'opened' | 'clicked' | 'not_opened' | 'not_clicked';
    timeframe: number; // hours
  };
}

interface TemplateSelection {
  type: 'single' | 'ab-test';
  templates: Array<{
    templateId: string;
    name: string;
    weight?: number;
  }>;
  testConfig?: {
    duration: number;
    winningCriteria: 'openRate' | 'clickRate' | 'conversionRate' | 'revenue';
  };
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { sendEmail, sendSms } = useResend();
  const firestoreService = new FirestoreService();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    type: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [followUpEmails, setFollowUpEmails] = useState<FollowUpEmail[]>([]);
  const [errors, setErrors] = useState<{
    template?: string;
    schedule?: string;
    audience?: string;
    followUps?: string[];
  }>({});
  const [templateSelection, setTemplateSelection] = useState<TemplateSelection>({
    type: 'single',
    templates: []
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingFollowUpIndex, setEditingFollowUpIndex] = useState<number | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number>(0);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState<string>('');
  const [smsDelay, setSmsDelay] = useState<number>(0);
  const [smsSendTime, setSmsSendTime] = useState<'with-email' | 'before-email' | 'after-email'>('with-email');
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const { subscription } = useSubscription();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('templateId');
        
    if (templateId) {
          // Load template from your template service
          const template = await firestoreService.getTemplate(templateId);
        if (template) {
          setSelectedTemplate(template);
            setTemplateSelection({
              type: 'single',
              templates: [{
                templateId: template.id,
                name: template.name
              }]
            });
          setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
    }
    };

    loadTemplate();
  }, []);

  useEffect(() => {
    const fetchSavedTemplates = async () => {
      try {
        const templates = await firestoreService.fetchSavedTemplates();
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error fetching saved templates:', error);
      }
    };

    fetchSavedTemplates();
  }, []);

  const steps = [
    { number: 1, name: 'Template', icon: EnvelopeIcon },
    { number: 2, name: 'Schedule', icon: CalendarIcon },
    { number: 3, name: 'Audience', icon: UsersIcon },
    { number: 4, name: 'Review', icon: ChartBarIcon },
  ];

  const handleTemplateSelect = (template: any) => {
    if (editingFollowUpIndex !== null) {
      // Handle follow-up template selection
      handleFollowUpChange(editingFollowUpIndex, {
        templateId: template.id,
        name: template.name
      });
      setIsTemplateModalOpen(false);
      setEditingFollowUpIndex(null);
    } else {
      // Handle main template selection
      if (templateSelection.type === 'single') {
        setTemplateSelection(prev => ({
          ...prev,
          templates: [{ templateId: template.id, name: template.name }]
        }));
      } else {
        setTemplateSelection(prev => {
          const newTemplates = [...prev.templates];
          if (selectedVariantIndex !== null) {
            newTemplates[selectedVariantIndex] = {
              ...newTemplates[selectedVariantIndex],
              templateId: template.id,
              name: template.name
            };
          }
          return { ...prev, templates: newTemplates };
        });
      }
    setSelectedTemplate(template);
      setIsTemplateModalOpen(false);
      setSelectedVariantIndex(null);
    }
  };

  const handleABTestOpen = () => {
    // Check subscription tier
    const isFreeTier = subscription?.tier === 'free';
    
    if (isFreeTier) {
      setTemplateSelection(prev => ({
        type: 'ab-test',
        templates: [
          { templateId: '', name: '', weight: 50 }, // Control
          { templateId: '', name: '', weight: 50 }  // One variant
        ],
        testConfig: { duration: 24, winningCriteria: 'openRate' }
      }));
      return;
    }

    if (!subscription?.features.abTesting) {
      toast.error('A/B testing requires a paid subscription. Please upgrade your plan.');
      return;
    }

    const maxVariants = subscription?.tier === 'pro' ? 5 : 3;
    setTemplateSelection(prev => ({
      type: 'ab-test',
      templates: [
        { templateId: '', name: '', weight: 50 }, // Control
        { templateId: '', name: '', weight: 50 }  // First variant
      ],
      testConfig: { duration: 24, winningCriteria: 'openRate' }
    }));
  };

  const handleAddVariant = () => {
    const isFreeTier = subscription?.tier === 'free';
    const maxVariants = subscription?.tier === 'pro' ? 5 : (subscription?.tier === 'growth' ? 3 : 2);

    if (isFreeTier && templateSelection.templates.length >= 1) {
      setError('Free tier users can only create one variant. Upgrade to add more variants.');
      return;
    }

    if (templateSelection.templates.length >= maxVariants) {
      setError(`Your current plan allows up to ${maxVariants} variants. Upgrade to add more.`);
      return;
    }

    const newWeight = Math.floor(100 / (templateSelection.templates.length + 1));
    setTemplateSelection(prev => ({
      ...prev,
      templates: [
        ...prev.templates,
        { templateId: '', name: '', weight: newWeight }
      ]
    }));

    // Redistribute weights evenly
    const updatedTemplates = templateSelection.templates.map(template => ({
      ...template,
      weight: newWeight
    }));
    setTemplateSelection(prev => ({
      ...prev,
      templates: updatedTemplates
    }));
  };

  const handleVariantUpdate = (index: number, updates: Partial<{
    templateId: string;
    name: string;
    weight: number;
  }>) => {
    setTemplateSelection(prev => {
      const newTemplates = [...prev.templates];
      const oldWeight = prev.templates[index].weight || 0;
      
      // If updating weight
      if (updates.weight !== undefined) {
        const newWeight = updates.weight;
        const weightDiff = newWeight - oldWeight;
        
        // Only proceed if there's an actual change
        if (Math.abs(weightDiff) > 0.01) {
          // Get other variants and their total weight
          const otherVariants = prev.templates.filter((_, i) => i !== index);
          const totalOtherWeight = otherVariants.reduce((sum, v) => sum + (v.weight || 0), 0);
          
          // Calculate weight adjustment ratio
          const adjustmentRatio = totalOtherWeight > 0 ? Math.abs(weightDiff) / totalOtherWeight : 0;
          
          // Update weights of other variants proportionally
          newTemplates.forEach((variant, i) => {
            if (i === index) {
              variant.weight = newWeight;
            } else {
              const currentWeight = variant.weight || 0;
              variant.weight = weightDiff > 0
                ? Math.max(0, currentWeight - (currentWeight * adjustmentRatio))
                : currentWeight + (currentWeight * adjustmentRatio);
            }
          });
          
          // Normalize weights to ensure they sum to 100
          const totalWeight = newTemplates.reduce((sum, v) => sum + (v.weight || 0), 0);
          if (Math.abs(totalWeight - 100) > 0.01) {
            const normalizationFactor = 100 / totalWeight;
            newTemplates.forEach(variant => {
              variant.weight = Math.round((variant.weight || 0) * normalizationFactor);
            });
          }
        }
      } else {
        // For non-weight updates
        newTemplates[index] = { ...newTemplates[index], ...updates };
      }
      
      return { ...prev, templates: newTemplates };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setTemplateSelection(prev => ({
      ...prev,
      templates: prev.templates.filter((_, i) => i !== index)
    }));
  };

  const validateVariantWeights = (): boolean => {
    if (templateSelection.type !== 'ab-test') return true;
    
    const totalWeight = templateSelection.templates.reduce((sum, variant) => 
      sum + (variant.weight || 0), 0
    );
    
    return Math.abs(totalWeight - 100) < 0.01; // Allow for small floating point differences
  };

  const validateStep = (step: number): boolean => {
    const newErrors: typeof errors = {};
    
    if (step === 1) {
      if (templateSelection.type === 'single') {
        if (!selectedTemplate) {
          newErrors.template = 'Please select a template to proceed';
        }
      } else {
        // A/B Testing validation
        const isFreeTier = subscription?.tier === 'free';
        const maxVariants = isFreeTier ? 2 : 
                          subscription?.tier === 'pro' ? 5 :
                          3;

        if (templateSelection.templates.length < 2) {
          newErrors.template = 'Please add at least 2 variants for A/B testing';
        } else if (templateSelection.templates.length > maxVariants) {
          newErrors.template = `Your current plan allows up to ${maxVariants} variants (including control)`;
        }
        if (!validateVariantWeights()) {
          newErrors.template = 'Variant weights must total 100%';
        }
        if (templateSelection.templates.some(t => !t.templateId)) {
          newErrors.template = 'Please select templates for all variants';
        }
      }
    }
    
    if (step === 2 && scheduleConfig.type === 'scheduled') {
      if (!scheduleConfig.datetime) {
        newErrors.schedule = 'Please select a date and time';
      } else if (scheduleConfig.datetime < new Date()) {
        newErrors.schedule = 'Scheduled time must be in the future';
      }
    }
    
    if (step === 3) {
      if (selectedAudiences.length === 0) {
        newErrors.audience = 'Please select at least one audience segment';
      }
      
      const followUpErrors: string[] = [];
      followUpEmails.forEach((email, index) => {
        if (!email.name.trim()) {
          followUpErrors[index] = 'Name is required';
        }
        if (!email.condition.type) {
          followUpErrors[index] = 'Trigger condition is required';
        }
        if (!email.delay) {
          followUpErrors[index] = 'Delay is required';
        }
      });
      if (followUpErrors.length > 0) {
        newErrors.followUps = followUpErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Check if template is selected for all variants
    const allTemplatesSelected = templateSelection.templates.every(v => v.templateId && v.name);
    if (!allTemplatesSelected) {
      setError('Please select templates for all variants before proceeding.');
      return;
    }

    // Check if weights sum to 100%
    const totalWeight = templateSelection.templates.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight !== 100) {
      setError('Total variant weights must equal 100%.');
      return;
    }

    setCurrentStep(currentStep + 1);
    setError(null);
  };

  const handleAddFollowUpEmail = () => {
    setFollowUpEmails(prev => [...prev, {
      templateId: '',
      name: `Follow-up ${prev.length + 1}`,
      delay: 24,
      condition: {
        type: 'not_opened',
        timeframe: 24
      }
    }]);
  };

  const handleFollowUpChange = (index: number, updates: Partial<FollowUpEmail>) => {
    setFollowUpEmails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const handleAudienceSelect = (selectedCount: number, selectedContacts: any[]) => {
    setSelectedAudiences(selectedContacts);
    console.log(`Selected audience count: ${selectedCount}`);
    // Additional logic to handle selected contacts can be added here
  };

  const handleSend = async () => {
    try {
      setIsSending(true);
      setError(null);

      // Validate required fields
      if (!template) {
        setError('Please select an email template');
        return;
      }

      if (!contacts.length) {
        setError('Please select your target audience');
        return;
      }

      // Calculate total emails needed including follow-ups
      const totalEmails = contacts.length * (1 + followUpEmails.length);
      const totalSMS = smsEnabled ? contacts.length : 0;

      // Check subscription limits
      if (totalEmails > subscription.maxEmails) {
        setError(`You have exceeded your email limit. Your plan allows ${subscription.maxEmails} emails, but this campaign requires ${totalEmails} emails.`);
        return;
      }

      if (totalSMS > subscription.maxSMS) {
        setError(`You have exceeded your SMS limit. Your plan allows ${subscription.maxSMS} SMS messages, but this campaign requires ${totalSMS} messages.`);
        return;
      }

      if (contacts.length > subscription.maxContacts) {
        setError(`You have exceeded your contacts limit. Your plan allows ${subscription.maxContacts} contacts, but this campaign has ${contacts.length} contacts.`);
        return;
      }

      // Create campaign in Firestore
      const campaign = await firestoreService.createCampaign({
        name: template.name,
        templateId: template.id,
        contacts: contacts.length,
        scheduleConfig,
        smsConfig: smsEnabled ? {
          template: smsTemplate,
          delay: smsDelay,
          sendTime: smsSendTime
        } : undefined,
        status: scheduleConfig.type === 'immediate' ? 'active' : 'scheduled',
        createdAt: new Date().toISOString(),
        followUpEmails: followUpEmails.length > 0 ? followUpEmails : undefined,
        abTest: templateSelection.type === 'ab-test' ? {
          enabled: true,
          variants: templateSelection.templates,
          testConfig: templateSelection.testConfig
        } : undefined
      });

      // Redirect to campaign details
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const openTemplateSelector = (index: number, isFollowUp: boolean = false) => {
    if (isFollowUp) {
      setEditingFollowUpIndex(index);
    } else {
      setSelectedVariantIndex(index);
    }
    setIsTemplateModalOpen(true);
  };

  const handleSendSms = async () => {
    if (smsEnabled && smsTemplate) {
      await sendSms(smsTemplate, smsDelay);
    }
  };

  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* A/B Testing Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  A/B Testing
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Test different email variations to optimize performance
                </p>
              </div>
              <div className="flex items-center">
          <button
                  onClick={() => {
                    const newType = templateSelection.type === 'single' ? 'ab-test' : 'single';
                    setTemplateSelection(prev => ({
                      type: newType,
                      templates: newType === 'ab-test' 
                        ? [
                            ...prev.templates,
              { templateId: '', name: '', weight: 50 }
                          ]
                        : [prev.templates[0] || { templateId: '', name: '' }],
                      testConfig: newType === 'ab-test' 
                        ? { duration: 24, winningCriteria: 'openRate' }
                        : undefined
                    }));
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    templateSelection.type === 'ab-test' ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      templateSelection.type === 'ab-test' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
          </button>
        </div>
      </div>

            {/* Template Variants */}
            <div className="space-y-4">
          {templateSelection.templates.map((template, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-grow">
                      <h4 className="text-base font-medium text-gray-900">
                        {templateSelection.type === 'ab-test'
                          ? `Variant ${String.fromCharCode(65 + index)}`
                          : 'Email Template'}
                      </h4>
                      {template.name ? (
                        <p className="mt-1 text-sm text-gray-500">{template.name}</p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500 italic">No template selected</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => openTemplateSelector(index)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {template.templateId ? 'Change Template' : 'Select Template'}
                      </button>
                      {templateSelection.type === 'ab-test' && index > 0 && (
                  <button
                    onClick={() => handleRemoveVariant(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                          <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
                </div>

                  {templateSelection.type === 'ab-test' && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">
                        Traffic Split
                      </label>
                      <div className="flex-grow">
                  <input
                          type="range"
                    min="0"
                    max="100"
                    value={template.weight || 0}
                          onChange={(e) =>
                            handleVariantUpdate(index, {
                              ...template,
                              weight: parseInt(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>{template.weight || 0}%</span>
                          <span>100%</span>
                </div>
              </div>
            </div>
                  )}
            </div>
          ))}
          </div>

            {/* A/B Test Controls */}
            {templateSelection.type === 'ab-test' && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="text-sm font-medium text-gray-900">Test Duration</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      How long to run the test before selecting a winner
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                      max="72"
                      value={templateSelection.testConfig?.duration || 24}
                      onChange={(e) =>
                        setTemplateSelection((prev) => ({
                  ...prev,
                  testConfig: {
                    ...prev.testConfig,
                            duration: parseInt(e.target.value),
                          },
                        }))
                  }
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
                    <span className="text-sm text-gray-500">hours</span>
                  </div>
            </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="text-sm font-medium text-gray-900">Winning Criteria</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      How to determine the winning variant
                    </p>
                  </div>
              <select
                value={templateSelection.testConfig?.winningCriteria || 'openRate'}
                    onChange={(e) =>
                      setTemplateSelection((prev) => ({
                  ...prev,
                  testConfig: {
                    ...prev.testConfig,
                          winningCriteria: e.target.value as any,
                        },
                      }))
                  }
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="openRate">Open Rate</option>
                <option value="clickRate">Click Rate</option>
                <option value="conversionRate">Conversion Rate</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>

                {templateSelection.templates.length < 3 && (
                  <button
                    onClick={handleAddVariant}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Variant
                  </button>
                )}
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderTemplateStep();
      case 2:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Schedule Campaign
            </h2>
            {errors.schedule && (
              <div className="mb-4 text-sm text-red-600">{errors.schedule}</div>
            )}
            <CampaignScheduler
              initialConfig={scheduleConfig}
              onChange={setScheduleConfig}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Select Your Audience</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose between AI-powered audience discovery or import your own contacts
                  </p>
                </div>
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
              </div>
              {errors.audience && (
                <div className="mb-4 text-sm text-red-600">{errors.audience}</div>
              )}
              <AudienceSelector
                selectedAudiences={selectedAudiences}
                onChange={setSelectedAudiences}
              />
            </div>

            <div className="space-y-6 bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Follow-up Emails</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create automated follow-up emails based on recipient engagement
                  </p>
                </div>
                <button
                  onClick={handleAddFollowUpEmail}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Follow-up
                </button>
              </div>
              
              {followUpEmails.map((followUp, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={followUp.name}
                      onChange={(e) => handleFollowUpChange(index, { name: e.target.value })}
                      placeholder="Follow-up Name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      onClick={() => {
                        setFollowUpEmails(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="ml-2 p-2 text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trigger Condition</label>
                      <select
                        value={followUp.condition.type}
                        onChange={(e) => handleFollowUpChange(index, {
                          condition: { ...followUp.condition, type: e.target.value as any }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="not_opened">Not Opened</option>
                        <option value="not_clicked">Not Clicked</option>
                        <option value="opened">Opened</option>
                        <option value="clicked">Clicked</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Within Timeframe (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={followUp.condition.timeframe}
                        onChange={(e) => handleFollowUpChange(index, {
                          condition: { ...followUp.condition, timeframe: parseInt(e.target.value) }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Send After (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={followUp.delay}
                      onChange={(e) => handleFollowUpChange(index, { delay: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Follow-up Template</label>
                    <div className="mt-1 flex items-center space-x-4">
                      <button
                        onClick={() => openTemplateSelector(index, true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {followUp.templateId ? 'Change Template' : 'Select Template'}
                      </button>
                      {followUp.templateId && (
                  <button
                          onClick={() => router.push(`/dashboard/templates/edit/${followUp.templateId}`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Edit Template
                  </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {followUpEmails.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No follow-up emails</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add follow-up emails to automatically engage with recipients based on their interaction
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Review Campaign
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Template</h3>
                <div className="mt-2">
                  <p className="text-lg font-medium text-gray-900">{selectedTemplate?.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{selectedTemplate?.description}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
                <div className="mt-2">
                  <p className="text-lg font-medium text-gray-900">
                    {scheduleConfig.type === 'immediate'
                      ? 'Send immediately'
                      : `Scheduled for ${scheduleConfig.datetime?.toLocaleString()}`}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">Timezone: {scheduleConfig.timezone}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Audience</h3>
                <div className="mt-2">
                  <p className="text-lg font-medium text-gray-900">{selectedContacts} recipients selected</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {contacts[0]?.industry ? `Target Market: ${contacts[0].industry}` : 'Custom imported audience'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Follow-up Emails</h3>
                <div className="mt-2">
                  <p className="text-lg font-medium text-gray-900">{followUpEmails.length} follow-ups configured</p>
                  {followUpEmails.map((email, index) => (
                    <div key={index} className="mt-2">
                      <p className="text-sm text-gray-900 font-medium">
                        Follow-up #{index + 1}:
                      </p>
                      <div className="ml-4 text-sm text-gray-500">
                        <p>• Name: "{email.name}"</p>
                        <p>• Timing: {email.delay} hours after {email.condition.type?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={handleSend}
                disabled={isSending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    {scheduleConfig.type === 'immediate' ? 'Sending...' : 'Scheduling...'}
                  </>
                ) : (
                  scheduleConfig.type === 'immediate' ? 'Send Campaign' : 'Schedule Campaign'
                )}
              </button>
            </div>
          </div>
        );
        default:
        return null;
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg max-w-md w-full">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">You're Offline</h3>
            <p className="mt-2 text-sm text-gray-500">
              Please check your internet connection to continue creating your campaign.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-400 hover:text-gray-500"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Create New Campaign
              </h1>
            </div>
          </div>

          {/* Steps */}
          <nav aria-label="Progress" className="mt-4">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li
                  key={step.name}
                  className={`${
                    stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                  } relative`}
                >
                  <div className="flex items-center">
                    <div
                      className={`${
                        step.number <= currentStep
                          ? 'bg-indigo-600'
                          : 'bg-gray-200'
                      } h-8 w-8 rounded-full flex items-center justify-center`}
                    >
                      <step.icon
                        className={`h-5 w-5 ${
                          step.number <= currentStep
                            ? 'text-white'
                            : 'text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="hidden sm:block ml-4 text-sm font-medium text-gray-500">
                      {step.name}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentStep(curr => Math.max(1, curr - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </button>
          {currentStep < 4 && (
          <button
            onClick={handleNextStep}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              Next
          </button>
          )}
        </div>

        {/* Template Selection Modal */}
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => {
            setIsTemplateModalOpen(false);
            setEditingFollowUpIndex(null);
            setSelectedVariantIndex(null);
          }}
          title={editingFollowUpIndex !== null ? "Select Follow-up Template" : "Select Template"}
        >
          <TemplateSelector
            onSelect={handleTemplateSelect}
            onCreateNew={() => {
              router.push('/dashboard/templates/new');
              setIsTemplateModalOpen(false);
            }}
            onEdit={(template) => {
              router.push(`/dashboard/templates/edit/${template.id}`);
              setIsTemplateModalOpen(false);
            }}
          />
        </Modal>
      </div>
    </div>
  );
}