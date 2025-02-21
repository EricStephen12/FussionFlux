# Deployment Guide

## Prerequisites

- Node.js 16.x or later
- npm 7.x or later
- Git
- Firebase account
- SendGrid account
- NOWPayments account
- Upstash Redis account
- Domain name and SSL certificate

## Environment Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd dropship-email-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with all required environment variables (see Configuration section).

## Configuration

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with email/password
3. Create a Firestore database
4. Generate service account credentials
5. Add Firebase configuration to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Email Services Setup

1. Create a SendGrid account
2. Generate API key
3. Create email templates
4. Configure domain authentication
5. Add configuration to `.env.local`:
```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_email
APOLLO_IO_API_KEY=your_apollo_api_key
```

### Payment Gateway Setup

1. Set up NOWPayments account
2. Generate API keys
3. Configure IPN callback URL
4. Add configuration to `.env.local`:
```env
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
```

### Redis Setup

1. Create Upstash Redis database
2. Get connection credentials
3. Add configuration to `.env.local`:
```env
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Database Setup

1. Initialize Firestore with required collections:
- users
- campaigns
- transactions
- referrals
- error_logs

2. Set up Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

## Security Configuration

1. Configure reCAPTCHA:
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

2. Set up rate limiting:
```env
RATE_LIMIT_APOLLO=60
RATE_LIMIT_SENDGRID=100
RATE_LIMIT_GENERAL=30
```

## Production Build

1. Build the application:
```bash
npm run build
```

2. Test the production build locally:
```bash
npm run start
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Manual Deployment

1. Set up a production server with Node.js
2. Install PM2 for process management:
```bash
npm install -g pm2
```

3. Start the application:
```bash
pm2 start npm --name "dropship-email" -- start
```

## Post-Deployment

1. Set up monitoring:
```bash
npm run monitoring:setup
```

2. Configure automated backups:
```bash
npm run backup:setup
```

3. Set up SSL certificate:
```bash
certbot --nginx -d yourdomain.com
```

## Cron Jobs Setup

1. Set up the campaign processing cron job:
```bash
crontab -e
```

2. Add the following line:
```
*/5 * * * * curl -X POST https://yourdomain.com/api/cron/process-campaigns -H "Authorization: Bearer ${CRON_SECRET}"
```

## Health Checks

1. Configure uptime monitoring:
```bash
npm run monitoring:uptime
```

2. Set up error alerting:
```bash
npm run monitoring:alerts
```

## Backup Configuration

1. Set up Firestore automated backups:
```bash
gcloud firestore export gs://your-backup-bucket
```

2. Schedule daily backups:
```bash
0 0 * * * gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)
```

## Performance Optimization

1. Enable caching:
```bash
vercel edge-config enable
```

2. Configure CDN:
```bash
vercel edge-network enable
```

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
- Check Firebase configuration
- Verify IP allowlist
- Check service account permissions

2. **Email Delivery Problems**
- Verify SendGrid domain authentication
- Check email templates
- Monitor bounce rates

3. **Payment Processing Issues**
- Verify NOWPayments API key
- Check IPN endpoint accessibility
- Monitor transaction logs

### Monitoring

1. Set up logging:
```bash
npm run logging:setup
```

2. Configure error tracking:
```bash
npm run sentry:setup
```

3. Enable performance monitoring:
```bash
npm run monitoring:performance
```

## Scaling

1. Configure auto-scaling:
```bash
vercel scale enable
```

2. Set up load balancing:
```bash
vercel lb:setup
```

3. Enable serverless functions:
```bash
vercel functions:enable
```

## Maintenance

1. Regular updates:
```bash
npm run update:check
npm run update:apply
```

2. Database maintenance:
```bash
npm run db:optimize
```

3. Cache management:
```bash
npm run cache:clear
```

## Support

For deployment support:
1. Check the troubleshooting guide
2. Review error logs
3. Contact support team
4. Submit issues on GitHub 