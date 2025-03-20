import { Subscriber } from './subscriber';
import { subscriberService } from './subscriber';
import { renderToStaticMarkup } from 'react-dom/server';
import EmailFooter from '@/components/emails/EmailFooter';

interface EmailData {
  subject: string;
  content: string;
  preheader?: string;
  unsubscribeUrl?: string;
  campaignId?: string;
  userId: string;
}

/**
 * Service for managing email templates and generating final email HTML
 * that includes legal requirements like unsubscribe links
 */
class EmailTemplateService {
  /**
   * Generate the complete HTML for an email, including the unsubscribe footer
   */
  generateEmailHTML(emailData: EmailData, subscriber: Subscriber): string {
    // Generate the unsubscribe URL if not provided
    const unsubscribeUrl = emailData.unsubscribeUrl || subscriberService.generateUnsubscribeUrl(
      subscriber.email,
      emailData.userId,
      emailData.campaignId
    );
    
    // Render the footer component to HTML
    const footerHtml = renderToStaticMarkup(
      EmailFooter({
        unsubscribeUrl,
        campaignId: emailData.campaignId,
      })
    );
    
    // Construct the final HTML
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailData.subject}</title>
          ${emailData.preheader 
            ? `<meta name="description" content="${emailData.preheader}">` 
            : ''}
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            a {
              color: #4F46E5;
              text-decoration: none;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 10px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${emailData.preheader 
              ? `<div style="display: none; max-height: 0px; overflow: hidden;">${emailData.preheader}</div>` 
              : ''}
            
            ${emailData.content}
            
            ${footerHtml}
          </div>
        </body>
      </html>
    `;
  }
  
  /**
   * Replace template variables in an email with subscriber data
   */
  personalizeEmail(template: string, subscriber: Subscriber): string {
    const replacements: Record<string, string> = {
      '{{firstName}}': subscriber.firstName || 'Valued Customer',
      '{{lastName}}': subscriber.lastName || '',
      '{{email}}': subscriber.email,
      '{{currentYear}}': new Date().getFullYear().toString(),
    };

    // Add all custom fields
    if (subscriber.customFields) {
      Object.entries(subscriber.customFields).forEach(([key, value]) => {
        replacements[`{{${key}}}`] = String(value);
      });
    }

    // Perform replacements
    return Object.entries(replacements).reduce(
      (content, [placeholder, value]) => content.replace(new RegExp(placeholder, 'g'), value),
      template
    );
  }
  
  /**
   * Generate a test email for preview
   */
  generateTestEmail(emailData: EmailData): string {
    const testSubscriber: Subscriber = {
      id: 'test-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      source: 'manual',
      status: 'active',
      campaigns: [emailData.campaignId || 'test-campaign'],
      subscribedAt: new Date(),
      userId: emailData.userId,
    };
    
    const emailContent = this.personalizeEmail(emailData.content, testSubscriber);
    const emailDataWithContent = {
      ...emailData,
      content: emailContent,
    };
    
    return this.generateEmailHTML(emailDataWithContent, testSubscriber);
  }
}

export const emailTemplateService = new EmailTemplateService(); 