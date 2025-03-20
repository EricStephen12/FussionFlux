import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { isSpamDomain } from './spamDetection';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// IP Pool configuration for rotation
const IP_POOLS = [
  'pool1', // High reputation IPs
  'pool2', // Medium reputation IPs
  'pool3'  // Warm-up IPs
];

// Email sending limits
const RATE_LIMITS = {
  perSecond: 10,
  perMinute: 600,
  perHour: 25000,
  cooldownPeriod: 300 // 5 minutes in seconds
};

let currentIpPoolIndex = 0;
let emailsSentInLastHour = 0;
let lastRotationTime = Date.now();

// Create a transporter with IP rotation and anti-spam measures
const getTransporter = () => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  // Rotate IP pool if needed
  const shouldRotateIp = Date.now() - lastRotationTime > RATE_LIMITS.cooldownPeriod * 1000;
  if (shouldRotateIp) {
    currentIpPoolIndex = (currentIpPoolIndex + 1) % IP_POOLS.length;
    lastRotationTime = Date.now();
  }

  // For development/testing, use a test account
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVER_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_TEST_USER || 'test@example.com',
        pass: process.env.EMAIL_TEST_PASSWORD || 'password',
      },
    });
  }

  // For production, use configured email service with IP rotation
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    pool: true,
    maxConnections: 5,
    rateDelta: 1000 / RATE_LIMITS.perSecond,
    rateLimit: RATE_LIMITS.perSecond,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    // Custom headers for better deliverability
    customHeaders: {
      'X-IP-Pool': IP_POOLS[currentIpPoolIndex],
      'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
  });
};

// Enhanced email validation and anti-spam checks
const validateEmail = (options: EmailOptions) => {
  // Check for spam domains
  if (isSpamDomain(options.to)) {
    throw new Error('Recipient domain is blacklisted');
  }

  // Check rate limits
  if (emailsSentInLastHour >= RATE_LIMITS.perHour) {
    throw new Error('Hourly sending limit exceeded');
  }

  // Validate email content
  if (!options.html && !options.text) {
    throw new Error('Email must have either HTML or text content');
  }

  // Add spam score calculation
  const spamScore = calculateSpamScore(options);
  if (spamScore > 0.7) {
    throw new Error('Email content looks suspicious');
  }
};

// Calculate spam score based on content
const calculateSpamScore = (options: EmailOptions): number => {
  let score = 0;
  const spamTriggers = [
    'buy now', 'click here', 'free', 'discount', 'limited time',
    'act now', 'urgent', 'winner', 'guarantee', 'no risk'
  ];

  // Check subject
  spamTriggers.forEach(trigger => {
    if (options.subject.toLowerCase().includes(trigger)) score += 0.1;
  });

  // Check content
  const content = (options.text || '').toLowerCase();
  spamTriggers.forEach(trigger => {
    if (content.includes(trigger)) score += 0.05;
  });

  // Check for excessive capitalization
  const capsRatio = (options.subject.match(/[A-Z]/g) || []).length / options.subject.length;
  if (capsRatio > 0.3) score += 0.2;

  return score;
};

/**
 * Send an email using the configured email service with enhanced deliverability
 */
export async function sendEmail(options: EmailOptions) {
  try {
    // Validate email before sending
    validateEmail(options);
    
    const transporter = getTransporter();
    
    // Add deliverability headers
    const enhancedOptions = {
      ...options,
      headers: {
        'List-Unsubscribe': `<mailto:unsubscribe@${process.env.DOMAIN}>`,
        'Feedback-ID': `${Date.now()}:${IP_POOLS[currentIpPoolIndex]}`,
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
      },
    };
    
    const info = await transporter.sendMail(enhancedOptions);
    emailsSentInLastHour++;
    
    // Reset hourly counter after an hour
    setTimeout(() => {
      emailsSentInLastHour--;
    }, 3600000);
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send a batch of emails with smart throttling and rotation
 */
export async function sendBatchEmails(emails: EmailOptions[]) {
  try {
    const transporter = getTransporter();
    const batchSize = 50; // Process in smaller batches
    const results = [];
    
    // Process emails in batches with throttling
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Add delay between batches
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            validateEmail(email);
            const info = await transporter.sendMail({
              ...email,
              headers: {
                'List-Unsubscribe': `<mailto:unsubscribe@${process.env.DOMAIN}>`,
                'Feedback-ID': `${Date.now()}:${IP_POOLS[currentIpPoolIndex]}`,
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
              },
            });
            emailsSentInLastHour++;
            return { success: true, messageId: info.messageId, to: email.to };
          } catch (error) {
            console.error(`Error sending email to ${email.to}:`, error);
            return { success: false, error, to: email.to };
          }
        })
      );
      
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error('Error in batch email sending:', error);
    throw error;
  }
} 