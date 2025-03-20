import { Subscriber } from './subscriber';
import { subscriberService } from './subscriber';
import { emailTemplateService } from './emailTemplateService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SendEmailOptions {
  subject: string;
  content: string;
  preheader?: string;
  campaignId: string;
  userId: string;
  subscribers: Subscriber[];
  fromName: string;
  fromEmail: string;
}

class EmailService {
  /**
   * Send an email campaign to a list of subscribers
   */
  async sendEmailCampaign(options: SendEmailOptions): Promise<void> {
    const { subject, content, preheader, campaignId, userId, subscribers, fromName, fromEmail } = options;
    
    // Process each subscriber
    for (const subscriber of subscribers) {
      try {
        // Generate personalized email content
        const personalizedContent = emailTemplateService.personalizeEmail(content, subscriber);
        
        // Generate the complete email HTML with footer
        const emailHtml = emailTemplateService.generateEmailHTML({
          subject,
          content: personalizedContent,
          preheader,
          campaignId,
          userId,
        }, subscriber);
        
        // Log the email in Firestore for tracking
        await this.logEmail({
          campaignId,
          userId,
          subscriberId: subscriber.id,
          subject,
          content: emailHtml,
          fromName,
          fromEmail,
          toEmail: subscriber.email,
          status: 'sent',
        });
        
        // TODO: Integrate with your email sending provider (SendGrid, Amazon SES, etc.)
        // await emailProvider.send({
        //   from: `${fromName} <${fromEmail}>`,
        //   to: subscriber.email,
        //   subject,
        //   html: emailHtml,
        // });
        
        // Update subscriber's campaign history
        await subscriberService.logSubscriberEvent(subscriber.id, {
          type: 'email_sent',
          campaignId,
          metadata: {
            subject,
            fromName,
            fromEmail,
          },
        });
        
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error);
        
        // Log the failure
        await this.logEmail({
          campaignId,
          userId,
          subscriberId: subscriber.id,
          subject,
          content: emailHtml,
          fromName,
          fromEmail,
          toEmail: subscriber.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  
  /**
   * Log an email in Firestore for tracking and analytics
   */
  private async logEmail(data: {
    campaignId: string;
    userId: string;
    subscriberId: string;
    subject: string;
    content: string;
    fromName: string;
    fromEmail: string;
    toEmail: string;
    status: 'sent' | 'failed';
    error?: string;
  }): Promise<void> {
    await addDoc(collection(db, 'email_logs'), {
      ...data,
      sentAt: serverTimestamp(),
    });
  }
  
  /**
   * Send a test email to preview the campaign
   */
  async sendTestEmail(options: Omit<SendEmailOptions, 'subscribers'> & { testEmail: string }): Promise<void> {
    const testSubscriber: Subscriber = {
      id: 'test-id',
      email: options.testEmail,
      firstName: 'Test',
      lastName: 'User',
      source: 'manual',
      status: 'active',
      campaigns: [options.campaignId],
      subscribedAt: new Date(),
      userId: options.userId,
    };
    
    await this.sendEmailCampaign({
      ...options,
      subscribers: [testSubscriber],
    });
  }
}

export const emailService = new EmailService(); 