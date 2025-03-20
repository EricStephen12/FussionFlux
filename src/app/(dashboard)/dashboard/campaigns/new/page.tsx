'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { firestoreService } from '@/services/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Lead } from '@/models/LeadTypes'; // Import our Lead type
import TemplatePicker from '@/components/campaigns/TemplatePicker';
import TemplateEditor from '@/components/campaigns/TemplateEditor';
import CampaignDetailsForm from '@/components/campaigns/CampaignDetailsForm';
import AudienceStep from './AudienceStep'; // Import our new component
import ReviewStep from '@/components/campaigns/ReviewStep';
import { nanoid } from 'nanoid';
import { CreditService } from '@/services/creditService'; // Import the credit service

// Campaign creation steps
const STEPS = {
  DETAILS: 0,
  TEMPLATE: 1,
  AUDIENCE: 2,
  REVIEW: 3,
};

export default function NewCampaign() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(STEPS.DETAILS);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [campaignDetails, setCampaignDetails] = useState({
    name: '',
    subject: '',
    fromName: user?.displayName || '',
    fromEmail: user?.email || '',
    scheduledDate: new Date(),
    sendImmediately: false,
    enableABTesting: false,
    subjectB: '',
    testRatio: 50,
    testWinnerMetric: 'open',
    testDuration: 4
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step < STEPS.REVIEW) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > STEPS.DETAILS) {
      setStep(step - 1);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Check if the user has enough credits
      const leadCount = selectedLeads.length;
      const smsCount = blocks.some(block => block.type === 'sms') ? leadCount : 0;
      
      // Check if user has enough credits
      const creditCheck = await CreditService.checkSufficientCredits(user.uid, leadCount, smsCount, 0);
      
      if (!creditCheck.sufficient.all) {
        const missingCredits = [];
        if (!creditCheck.sufficient.emails) {
          missingCredits.push(`Email (need ${leadCount}, have ${creditCheck.available.emails})`);
        }
        if (!creditCheck.sufficient.sms && smsCount > 0) {
          missingCredits.push(`SMS (need ${smsCount}, have ${creditCheck.available.sms})`);
        }
        
        toast.error(`Insufficient credits: ${missingCredits.join(', ')}`);
        setLoading(false);
        return;
      }
      
      // Create campaign object
      const campaign = {
        id: nanoid(),
        userId: user.uid,
        name: campaignDetails.name,
        subject: campaignDetails.subject,
        fromName: campaignDetails.fromName,
        fromEmail: campaignDetails.fromEmail,
        blocks,
        templateName,
        leads: selectedLeads.map(lead => ({
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          company: lead.company || '',
          title: lead.title || '',
          source: lead.source,
          score: lead.score || 0
        })),
        status: campaignDetails.sendImmediately ? 'sending' : 'scheduled',
        scheduledDate: campaignDetails.scheduledDate,
        createdAt: new Date(),
        stats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
        },
        // Add A/B testing fields if enabled
        ...campaignDetails.enableABTesting && {
          abTesting: {
            enabled: true,
            subjectB: campaignDetails.subjectB,
            testRatio: campaignDetails.testRatio,
            testWinnerMetric: campaignDetails.testWinnerMetric,
            testDuration: campaignDetails.testDuration,
            testStatus: 'pending',
            testStartTime: null,
            testEndTime: null,
            winningSubject: null,
            variantAStats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            },
            variantBStats: {
              sent: 0,
              opened: 0,
              clicked: 0,
              openRate: 0,
              clickRate: 0
            }
          }
        }
      };
      
      // Save to Firestore
      await firestoreService.campaigns.add(campaign);
      
      // Use credits only if the campaign is being sent immediately
      if (campaignDetails.sendImmediately) {
        try {
          await CreditService.useCredits(
            user.uid, 
            leadCount, 
            smsCount, 
            0, // No leads being used
            campaign.id,
            'campaign',
            `Campaign: ${campaignDetails.name}`
          );
        } catch (creditError) {
          console.error('Error using credits:', creditError);
          // Don't fail the campaign creation, just log the error
          // We'll address credit usage in a background process
        }
      }
      
      toast.success('Campaign created successfully!');
      router.push('/dashboard/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case STEPS.DETAILS:
        return (
          <CampaignDetailsForm
            details={campaignDetails}
            onChange={setCampaignDetails}
            onNext={handleNext}
          />
        );
      case STEPS.TEMPLATE:
        return (
          <TemplatePicker 
            onSelect={(templateId) => {
              setSelectedTemplate(templateId);
              // Fetch the selected template data to get blocks
              if (templateId) {
                fetchTemplateData(templateId);
              }
            }} 
            selected={selectedTemplate}
            onNext={handleNext}
          />
        );
      case STEPS.AUDIENCE:
        return (
          <AudienceStep
            selectedLeads={selectedLeads}
            onSelect={setSelectedLeads}
            onNext={handleNext}
          />
        );
      case STEPS.REVIEW:
        return (
          <ReviewStep
            campaignDetails={campaignDetails}
            blocks={blocks}
            leadsCount={selectedLeads.length}
            onSubmit={handleCreateCampaign}
            loading={loading}
          />
        );
        default:
        return null;
    }
  };

  // Add this function to fetch template data using our new service
  const fetchTemplateData = async (templateId: string) => {
    try {
      setLoading(true);
      
      // Import the template service dynamically to avoid SSR issues
      const { templateService } = await import('@/services/templateService');
      
      // Get template from service
      const result = await templateService.get(templateId);
      
      if (result.success && result.data) {
        setBlocks(result.data.blocks || []);
        setTemplateName(result.data.name || '');
      } else {
        // Handle error with toast and fallback template
        toast.error(result.error || 'Failed to load template. Using a fallback template instead.');
        console.error('Template fetch error:', result.error, result.errorCode);
        
        // Get fallback template
        const fallbackTemplate = templateService.getFallbackTemplate(templateId);
        setBlocks(fallbackTemplate.blocks || []);
        setTemplateName(fallbackTemplate.name || '');
      }
    } catch (error) {
      console.error('Error in template fetching process:', error);
      toast.error('An unexpected error occurred. Using a default template.');
      
      // Create a basic fallback template if everything fails
      setBlocks([{
        id: 'fallback-text',
        type: 'text',
        content: {
          text: 'This is a default template. Please customize it for your campaign.',
          fontSize: '16px',
          color: '#333333'
        }
      }]);
      setTemplateName('Default Template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
          {step > STEPS.DETAILS && (
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {Object.keys(STEPS).map((key, index) => (
              <React.Fragment key={key}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= index 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{key.charAt(0) + key.slice(1).toLowerCase()}</span>
                </div>
                {index < Object.keys(STEPS).length - 1 && (
                  <div 
                    className={`h-1 flex-1 mx-2 ${
                      step > index ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}