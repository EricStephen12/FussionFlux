'use client';

import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  UserGroupIcon,
  BeakerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { CreditService } from '@/services/creditService';
import { emailTemplateService } from '@/services/emailTemplateService';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, CheckCircle2, Mail, Calendar, Clock, User, CreditCard, Smartphone } from 'lucide-react';

interface ReviewStepProps {
  campaignDetails: {
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    scheduledDate: Date;
    sendImmediately: boolean;
    enableABTesting?: boolean;
    subjectB?: string;
    testRatio?: number;
    testWinnerMetric?: 'open' | 'click';
    testDuration?: number;
  };
  blocks: any[];
  leadsCount: number;
  onSubmit: () => void;
  loading: boolean;
}

export default function ReviewStep({ 
  campaignDetails, 
  blocks, 
  leadsCount, 
  onSubmit, 
  loading 
}: ReviewStepProps) {
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creditInfo, setCreditInfo] = useState({
    available: {
      emails: 0,
      sms: 0,
      leads: 0
    },
    sufficient: false,
    loading: true
  });
  
  // Calculate if SMS is enabled in this campaign
  const smsEnabled = blocks.some(block => block.type === 'sms');
  const smsCount = smsEnabled ? leadsCount : 0;
  
  useEffect(() => {
    // Load credit information when component mounts or when leadsCount changes
    const loadCreditInfo = async () => {
      if (!user) return;
      
      try {
        setCreditInfo(prevInfo => ({ ...prevInfo, loading: true }));
        
        // Get available credits
        const availableCredits = await CreditService.getAvailableCredits(user.uid);
        
        // Check if user has enough credits
        const creditCheck = await CreditService.checkSufficientCredits(
          user.uid, 
          leadsCount,
          smsCount,
          0 // No leads being consumed
        );
        
        setCreditInfo({
          available: availableCredits,
          sufficient: creditCheck.sufficient.all,
          loading: false
        });
      } catch (error) {
        console.error('Error loading credit info:', error);
        setCreditInfo(prevInfo => ({ 
          ...prevInfo,
          loading: false 
        }));
      }
    };
    
    if (user) {
      loadCreditInfo();
    }
  }, [user, leadsCount, smsCount]);
  
  // Determine if we have enough credits based on real-time credit check
  const hasEnoughCredits = !creditInfo.loading && creditInfo.sufficient;
  const emailCredits = creditInfo.available.emails;
  
  // Generate email preview when showPreview is true
  useEffect(() => {
    if (showPreview && user?.uid) {
      generateEmailPreview();
    }
  }, [showPreview, blocks, campaignDetails]);
  
  const generateEmailPreview = async () => {
    try {
      setPreviewLoading(true);
      
      // Convert blocks to email content format
      // This is a simplified approach - you may need to adjust based on your template structure
      const emailContent = blocks.map(block => {
        // Here you would convert each block to HTML representation
        // For now, we'll just stringify the blocks for demonstration
        return `<div class="block ${block.type}">${JSON.stringify(block.content)}</div>`;
      }).join('');
      
      // Use the email template service
      const preview = emailTemplateService.generateTestEmail({
        subject: campaignDetails.subject,
        content: emailContent,
        preheader: campaignDetails.name,
        userId: user.uid,
        campaignId: 'preview'
      });
      
      setPreviewHtml(preview);
      setPreviewLoading(false);
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Campaign</h2>
      <p className="text-gray-500">
        Review your campaign details before sending to {leadsCount} recipient{leadsCount !== 1 ? 's' : ''}.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              General settings and delivery options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="flex items-center text-gray-500"><Mail className="h-4 w-4 mr-2" /> Campaign Name:</span>
              <span className="font-medium">{campaignDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center text-gray-500"><Mail className="h-4 w-4 mr-2" /> Subject:</span>
              <span className="font-medium">{campaignDetails.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center text-gray-500"><User className="h-4 w-4 mr-2" /> From:</span>
              <span className="font-medium">{campaignDetails.fromName} &lt;{campaignDetails.fromEmail}&gt;</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center text-gray-500"><Calendar className="h-4 w-4 mr-2" /> Schedule:</span>
              <span className="font-medium">
                {campaignDetails.sendImmediately 
                  ? 'Send immediately' 
                  : campaignDetails.scheduledDate.toLocaleString()}
              </span>
            </div>
            
            {campaignDetails.enableABTesting && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-700">A/B Testing Enabled</h4>
                <div className="text-sm text-blue-600 mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Subject B:</span>
                    <span className="font-medium">{campaignDetails.subjectB}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Ratio:</span>
                    <span className="font-medium">{campaignDetails.testRatio}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Winner Metric:</span>
                    <span className="font-medium capitalize">{campaignDetails.testWinnerMetric} rate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Test Duration:</span>
                    <span className="font-medium">{campaignDetails.testDuration} hours</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Credits Information */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Credits</CardTitle>
            <CardDescription>
              Credits required to send this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creditInfo.loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-500">
                    <Mail className="h-4 w-4 mr-2" /> Email Credits:
                  </span>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      {creditInfo.available.emails} available
                    </span>
                    <Badge variant={creditInfo.sufficient ? "success" : "destructive"}>
                      {creditInfo.sufficient ? "Sufficient" : "Insufficient"}
                    </Badge>
                  </div>
                </div>
                
                {smsEnabled && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-gray-500">
                      <Smartphone className="h-4 w-4 mr-2" /> SMS Credits:
                    </span>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">
                        {creditInfo.available.sms} available
                      </span>
                      <Badge variant={creditInfo.sufficient ? "success" : "destructive"}>
                        {creditInfo.sufficient ? "Sufficient" : "Insufficient"}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="p-3 rounded-md bg-gray-50 text-sm text-gray-600 mt-2">
                  <p className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    This campaign requires {leadsCount} email credits 
                    {smsEnabled ? ` and ${leadsCount} SMS credits` : ''}.
                  </p>
                </div>
                
                {!creditInfo.sufficient && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Credits</AlertTitle>
                    <AlertDescription>
                      You don't have enough credits to send this campaign.
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <a href="/dashboard/billing">Purchase Credits</a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Email Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>
            See how your email will appear to recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full py-8 text-center border-dashed border-2"
                onClick={() => setShowPreview(true)}
              >
                <Mail className="h-5 w-5 mr-2" />
                Click to Preview Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="preview-container mt-4 border rounded-md">
                  <div className="border-b p-3 bg-gray-50">
                    <p><strong>Subject:</strong> {campaignDetails.subject}</p>
                    <p><strong>From:</strong> {campaignDetails.fromName} &lt;{campaignDetails.fromEmail}&gt;</p>
                    <p><strong>To:</strong> {{`{{firstName}}`}} {{`{{lastName}}`}} &lt;{{`{{email}}`}}&gt;</p>
                  </div>
                  <div 
                    className="p-4 overflow-auto max-h-[60vh]" 
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <CardFooter className="flex justify-between px-0">
        <Button 
          disabled={loading || !creditInfo.sufficient} 
          onClick={onSubmit}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Campaign...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {creditInfo.sufficient ? 'Launch Campaign' : 'Insufficient Credits'}
            </>
          )}
        </Button>
      </CardFooter>
    </div>
  );
} 