'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import TemplateSelector from '@/components/campaigns/TemplateSelector';
import CampaignScheduler from '@/components/campaigns/CampaignScheduler';
import AudienceSelector from '@/components/campaigns/AudienceSelector';
import { useResend } from '../../../../../hooks/useResend';
import { FirestoreService } from '../../../../../services/firestore';

export default function NewCampaignPage() {
  const router = useRouter();
  const { sendEmail } = useResend();
  const firestoreService = new FirestoreService();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState({
    type: 'immediate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [followUpEmails, setFollowUpEmails] = useState<{ subject: string; body: string; delay: number; }[]>([]);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Add event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const steps = [
    { number: 1, name: 'Template', icon: EnvelopeIcon },
    { number: 2, name: 'Schedule', icon: CalendarIcon },
    { number: 3, name: 'Audience', icon: UsersIcon },
    { number: 4, name: 'Review', icon: ChartBarIcon },
  ];

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedTemplate) {
      alert('Please select a template or create a new one to proceed.');
      return;
    }
    setCurrentStep(curr => curr + 1);
  };

  // Add email preview and confirmation step
  const handleReview = () => {
    // Logic to preview the email
    // This could involve rendering a modal or navigating to a preview page
    console.log('Previewing email for confirmation');
  };

  const handleSend = async () => {
    try {
      // Convert template to HTML and send email
      const emailHtml = generateEmailHtml(selectedTemplate);
      await sendEmail({
        to: selectedAudiences.join(','),
        subject: selectedTemplate.subject,
        template: selectedTemplate,
      });

      // Schedule follow-up emails if configured
      if (scheduleConfig.type === 'scheduled') {
        // Save to Firestore for scheduled sending
        const campaignId = await firestoreService.createCampaign({
          name: selectedTemplate.name,
          niche: 'General', // Example niche
          totalEmails: selectedAudiences.length,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          userId: 'currentUserId', // Replace with actual user ID
          contacts: selectedAudiences.map(id => ({ id })),
          scheduledFor: scheduleConfig.timezone, // Example scheduled time
          followUpEmails, // Save follow-up emails
        });
        console.log('Scheduled email with follow-ups saved to Firestore with ID:', campaignId);
      }

      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const generateEmailHtml = (template: any) => {
    // Use the generateEmailHtml function from useResend
    return template.blocks.map((block: any) => {
      switch (block.type) {
        case 'hero':
          return `
            <div style="text-align: center; padding: 40px 20px; background-color: ${block.content.backgroundColor || '#f8fafc'}">
              <h1 style="font-size: 32px; margin-bottom: 16px;">${block.content.title}</h1>
              <p style="font-size: 18px; margin-bottom: 24px;">${block.content.subtitle}</p>
              ${block.content.imageUrl ? `<img src="${block.content.imageUrl}" alt="" style="max-width: 100%; margin-bottom: 24px;">` : ''}
              ${block.content.button ? `<a href="${block.content.button.url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">${block.content.button.text}</a>` : ''}
            </div>
          `;
        case 'text':
          return `
            <div style="padding: 20px; background-color: ${block.content.backgroundColor || '#ffffff'}">
              <p style="color: ${block.content.color || '#000000'}; font-size: ${block.content.fontSize || '16px'}; text-align: ${block.content.align || 'left'};">
                ${block.content.text}
              </p>
            </div>
          `;
        // Add more block types as needed
        default:
          return '';
      }
    }).join('');
  };

  const handleAddFollowUpEmail = () => {
    setFollowUpEmails([...followUpEmails, { subject: '', body: '', delay: 1 }]);
  };

  const handleFollowUpChange = (index: number, field: string, value: string | number) => {
    const updatedFollowUps = [...followUpEmails];
    updatedFollowUps[index] = { ...updatedFollowUps[index], [field]: value };
    setFollowUpEmails(updatedFollowUps);
  };

  // Show offline warning if not online
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
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select Template
            </h2>
            <TemplateSelector
              onSelect={handleTemplateSelect}
              onCreateNew={() => router.push('/dashboard/templates/new')}
              onEdit={(template) => router.push(`/dashboard/templates/edit/${template.id}`)}
              onDuplicate={(template) => {
                // Handle template duplication
                console.log('Duplicate template:', template);
              }}
              onDelete={(templateId) => {
                // Handle template deletion
                console.log('Delete template:', templateId);
              }}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Schedule Campaign
            </h2>
            <CampaignScheduler
              initialConfig={scheduleConfig}
              onChange={setScheduleConfig}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Select Audience
            </h2>
            <AudienceSelector
              initialSelected={selectedAudiences}
              onSelect={setSelectedAudiences}
            />
            <div className="mt-4">
              <h3 className="text-lg font-medium">Follow-Up Emails</h3>
              {followUpEmails.map((email, index) => (
                <div key={index} className="mt-2">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={email.subject}
                    onChange={(e) => handleFollowUpChange(index, 'subject', e.target.value)}
                    className="block w-full mt-1"
                  />
                  <textarea
                    placeholder="Body"
                    value={email.body}
                    onChange={(e) => handleFollowUpChange(index, 'body', e.target.value)}
                    className="block w-full mt-1"
                  />
                  <input
                    type="number"
                    placeholder="Delay (days)"
                    value={email.delay}
                    onChange={(e) => handleFollowUpChange(index, 'delay', parseInt(e.target.value, 10))}
                    className="block w-full mt-1"
                  />
                </div>
              ))}
              <button
                onClick={handleAddFollowUpEmail}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Follow-Up Email
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Review Campaign
            </h2>
            <div className="space-y-8">
              {/* Template Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Template</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedTemplate?.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedTemplate?.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Schedule Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {scheduleConfig.type === 'immediate'
                        ? 'Send immediately'
                        : scheduleConfig.type === 'scheduled'
                        ? `Scheduled for ${scheduleConfig.datetime?.toLocaleString()}`
                        : 'Recurring campaign'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Timezone: {scheduleConfig.timezone}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Audience Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Audience</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedAudiences.length} segments selected
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Estimated reach: {/* Add audience size calculation */}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleReview}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Preview
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentStep(curr => Math.max(1, curr - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextStep}
            disabled={
              (currentStep === 1 && !selectedTemplate) ||
              (currentStep === 3 && selectedAudiences.length === 0)
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length ? 'Launch Campaign' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}