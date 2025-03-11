import { Resend } from 'resend';
import { Template } from '@/types/template';
import { Twilio } from 'twilio';
import { aiOptimizationService, type AIOptimizationMetrics } from '@/services/ai-optimization';
import { ApolloContact } from '@/services/apollo';
import { firestoreService } from '@/services/firestore';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
const twilio = new Twilio(
  process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID,
  process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN
);

interface SendEmailParams {
  to: string;
  subject: string;
  template: Template;
  analytics?: {
    enableTracking?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
    };
  };
}

interface SmartSendParams extends SendEmailParams {
  contact: ApolloContact;
  enableAI?: boolean;
}

interface SendSmsParams {
  to: string;
  message: string;
  delay?: number;
  sendTime?: 'with-email' | 'before-email' | 'after-email';
}

export const useResend = () => {
  const aiService = aiOptimizationService;

  const sendSmartEmail = async ({
    to,
    subject,
    template,
    contact,
    analytics,
    enableAI = true
  }: SmartSendParams) => {
    try {
      let finalTemplate = template;
      let aiMetrics: AIOptimizationMetrics | undefined;

      if (enableAI) {
        // Apply AI optimizations
        const { optimizedTemplate, metrics } = await aiService.optimizeEmailContent(
          template,
          contact
        );
        finalTemplate = optimizedTemplate;
        aiMetrics = metrics;
      }

      // Send email with optimizations
      const result = await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to,
        subject,
        html: generateEmailHtml(finalTemplate),
        tags: [
          { name: 'ai_optimized', value: enableAI.toString() },
          { name: 'template_id', value: template.id }
        ],
        ...analytics
      });

      // Track AI performance if enabled
      if (enableAI && aiMetrics) {
        await firestoreService.addDocument('ai_metrics', {
          emailId: result.id,
          metrics: aiMetrics,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('Smart email sending error:', error);
      throw error;
    }
  };

  const sendSms = async ({ to, message, delay, sendTime }: SendSmsParams) => {
    try {
      if (delay && delay > 0) {
        // Schedule SMS for later
        const scheduledTime = new Date(Date.now() + delay * 60 * 60 * 1000);
        
        await twilio.messages.create({
          to,
          from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER,
          body: message,
          scheduleType: 'fixed',
          sendAt: scheduledTime.toISOString(),
        });
      } else {
        // Send SMS immediately
        await twilio.messages.create({
          to,
          from: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER,
          body: message,
        });
      }

      return true;
    } catch (error) {
      console.error('Error sending SMS with Twilio:', error);
      throw error;
    }
  };

  const generateEmailHtml = (template: Template) => {
    // Add UTM parameters to all links if analytics is enabled
    const addUtmParams = (url: string, utmParams?: { source?: string; medium?: string; campaign?: string }) => {
      if (!utmParams) return url;
      const params = new URLSearchParams();
      if (utmParams.source) params.append('utm_source', utmParams.source);
      if (utmParams.medium) params.append('utm_medium', utmParams.medium);
      if (utmParams.campaign) params.append('utm_campaign', utmParams.campaign);
      return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    };

    // Convert template blocks to HTML with analytics
    const blocksHtml = template.blocks
      .map((block) => {
        switch (block.type) {
          case 'hero':
            return `
              <div style="text-align: center; padding: 40px 20px; background-color: ${block.content.backgroundColor || '#f8fafc'}">
                <h1 style="font-size: 32px; margin-bottom: 16px;">${block.content.title}</h1>
                <p style="font-size: 18px; margin-bottom: 24px;">${block.content.subtitle}</p>
                ${block.content.imageUrl ? `<img src="${block.content.imageUrl}" alt="" style="max-width: 100%; margin-bottom: 24px;">` : ''}
                ${block.content.button ? `<a href="${addUtmParams(block.content.button.url || '#', template.analytics?.utmParams)}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">${block.content.button.text}</a>` : ''}
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
          case 'image':
            return `
              <div style="padding: 20px;">
                <img src="${block.content.imageUrl}" alt="${block.content.alt || ''}" style="max-width: 100%; width: ${block.content.width || 'auto'}; height: ${block.content.height || 'auto'};">
              </div>
            `;
          case 'product':
            return `
              <div style="padding: 20px; background-color: ${block.content.backgroundColor || '#ffffff'}; border-radius: ${block.content.borderRadius || '0'}; ${block.content.boxShadow ? 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);' : ''}">
                <img src="${block.content.imageUrl}" alt="Product" style="width: 100%; height: auto; margin-bottom: 16px;">
                <h3 style="font-size: 20px; margin-bottom: 8px;">Product Title</h3>
                ${block.content.showPrice ? '<p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">$19.99</p>' : ''}
                ${block.content.showDescription ? '<p style="color: #666666; margin-bottom: 16px;">Product Description</p>' : ''}
                <a href="#" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">${block.content.buttonText || 'Buy Now'}</a>
              </div>
            `;
          default:
            return '';
        }
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.name}</title>
          ${template.analytics?.enableTracking ? `
            <script>
              // Add tracking pixel for open tracking
              new Image().src = "https://api.yourdomain.com/track/open/${template.id}";
              
              // Add click tracking
              document.addEventListener('click', function(e) {
                if (e.target.tagName === 'A') {
                  fetch("https://api.yourdomain.com/track/click/${template.id}", {
                    method: 'POST',
                    body: JSON.stringify({ url: e.target.href }),
                  });
                }
              });
            </script>
          ` : ''}
        </head>
        <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${blocksHtml}
          ${template.sms?.enabled ? `
            <div style="text-align: center; padding: 20px; background-color: #f9fafb; margin-top: 40px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Want to receive updates via SMS? 
                <a href="${addUtmParams(`https://yourdomain.com/sms-consent/${template.id}`, template.analytics?.utmParams)}" style="color: #3b82f6; text-decoration: none;">Click here to opt-in</a>
              </p>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  };

  return { sendEmail: sendSmartEmail, sendSms };
};
