# Dropship Email Platform

A comprehensive email marketing platform designed specifically for dropshippers, featuring lead generation, campaign management, and analytics.

## Features

- **Multi-source Lead Generation**: Fetch high-converting leads from Apollo, Facebook, TikTok, Instagram, and Google
- **A/B Testing**: Test different subject lines and content to optimize campaign performance
- **Email Campaign Builder**: Create beautiful, responsive email campaigns with a drag-and-drop editor
- **Analytics Dashboard**: Track opens, clicks, conversions, and revenue from your campaigns
- **Subscription Management**: Different tiers with varying features and limits
- **Lead Scoring**: AI-powered lead scoring to identify the most promising prospects

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Firebase account (for authentication and database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/dropship-email-platform.git
cd dropship-email-platform
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_APOLLO_API_KEY=your_apollo_api_key
NEXT_PUBLIC_FACEBOOK_API_KEY=your_facebook_api_key
NEXT_PUBLIC_TIKTOK_API_KEY=your_tiktok_api_key
NEXT_PUBLIC_INSTAGRAM_API_KEY=your_instagram_api_key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/contexts` - React context providers (Auth, Subscription)
- `/src/models` - TypeScript interfaces and types
- `/src/services` - Service layer for API interactions
- `/src/utils` - Utility functions and helpers

## Lead Sources

The platform integrates with multiple lead sources:

1. **Apollo** - Business and B2B leads
2. **Facebook** - Social media leads with engagement data
3. **TikTok** - Video engagement-based leads
4. **Instagram** - Visual content engagement leads
5. **Google** - Search and Maps business leads

Each source has its own adapter that handles fetching and processing leads according to the specific API requirements.

## Subscription Tiers

- **Free**: Limited access to basic features
- **Starter**: More leads and emails, basic A/B testing
- **Growth**: Full access to all lead sources and advanced features
- **Pro**: Unlimited leads, emails, and premium features

## License

This project is licensed under the MIT License - see the LICENSE file for details. 