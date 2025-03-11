import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getCurrentCampaignCount } from '../../services/campaignService';
import { creditsService } from '@/services/credits';

const CampaignCreation: React.FC = () => {
    const { subscription } = useSubscription();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableCredits, setAvailableCredits] = useState({
        emails: 0,
        sms: 0,
        leads: 0
    });

    useEffect(() => {
        const loadCredits = async () => {
            if (!subscription?.userId) return;
            
            try {
                setLoading(true);
                // Get base tier limits
                const baseEmails = subscription.maxEmails - (subscription.usageStats?.usedEmails || 0);
                const baseSMS = subscription.maxSMS - (subscription.usageStats?.usedSMS || 0);
                const baseLeads = subscription.maxContacts - (subscription.usageStats?.usedLeads || 0);

                // Get extra credits
                const extraEmails = await creditsService.getAvailableExtraCredits(subscription.userId, 'emails');
                const extraSMS = await creditsService.getAvailableExtraCredits(subscription.userId, 'sms');
                const extraLeads = await creditsService.getAvailableExtraCredits(subscription.userId, 'leads');

                // Set total available credits
                setAvailableCredits({
                    emails: baseEmails + extraEmails,
                    sms: baseSMS + extraSMS,
                    leads: baseLeads + extraLeads
                });
            } catch (error) {
                console.error('Error loading credits:', error);
                setError('Failed to load available credits');
            } finally {
                setLoading(false);
            }
        };

        loadCredits();
    }, [subscription]);

    const handleCreateCampaign = async (campaignData: any) => {
        try {
            const requiredEmails = campaignData.audienceSize;
            const requiredSMS = campaignData.includeSMS ? campaignData.audienceSize : 0;
            const requiredLeads = campaignData.useNewLeads ? campaignData.audienceSize : 0;

            // Check if user has enough credits
            if (requiredEmails > availableCredits.emails) {
                throw new Error(`Insufficient email credits. You need ${requiredEmails} but have ${availableCredits.emails}`);
            }
            if (requiredSMS > availableCredits.sms) {
                throw new Error(`Insufficient SMS credits. You need ${requiredSMS} but have ${availableCredits.sms}`);
            }
            if (requiredLeads > availableCredits.leads) {
                throw new Error(`Insufficient lead credits. You need ${requiredLeads} but have ${availableCredits.leads}`);
            }

            // Proceed with campaign creation
            // ... existing campaign creation logic ...

        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleABTesting = () => {
        const { subscription } = useSubscription();
        const isFreeTier = subscription?.tier === 'free';
        const isABTestingEnabled = subscription ? subscription.features.abTesting : false;

        if (!isABTestingEnabled && !isFreeTier) {
            return {
                allowed: false,
                message: 'A/B testing requires a paid subscription. Please upgrade your plan.',
                upgradeLink: '/dashboard/subscription'
            };
        }

        // Return A/B testing configuration based on tier
        if (isFreeTier) {
            return {
                allowed: true,
                maxVariants: 1,
                features: ['subject-line'],
                message: 'Free tier allows basic A/B testing with subject lines only. Upgrade for more features.'
            };
        }

        return {
            allowed: true,
            maxVariants: subscription.tier === 'pro' ? 5 : 2,
            features: subscription.tier === 'pro' 
                ? ['subject-line', 'content', 'sender-name', 'send-time']
                : ['subject-line', 'content']
        };
    };

    const handleAnalytics = () => {
        const { subscription } = useSubscription();
        const isFreeTier = subscription?.tier === 'free';

        if (isFreeTier) {
            return {
                basic: true,
                advanced: false,
                message: 'Free tier includes basic analytics. Upgrade for advanced insights.'
            };
        }

        // Full analytics for paid tiers
        // ... existing code ...
    };

    const handleFollowUp = () => {
        const { subscription } = useSubscription();
        const hasFollowUpAccess = subscription ? subscription.features.followUpEmails : false;

        if (!hasFollowUpAccess) {
            setError('Follow-up emails are only available for paid subscriptions. Please upgrade your plan.');
            return;
        }

        // Follow-up email logic for paid tiers
        // ... existing code ...
    };

    if (loading) {
        return <div>Loading campaign resources...</div>;
    }

    if (error) {
        return (
            <div className="text-red-500 mb-4">
                {error}
                <button 
                    className="ml-4 text-blue-500 underline"
                    onClick={() => window.location.href = '/dashboard/credits'}
                >
                    Purchase Credits
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Available Credits</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Email Credits</p>
                        <p className="text-lg font-medium">{availableCredits.emails.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">SMS Credits</p>
                        <p className="text-lg font-medium">{availableCredits.sms.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Lead Credits</p>
                        <p className="text-lg font-medium">{availableCredits.leads.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Campaign creation form */}
            {/* ... existing form JSX ... */}
        </div>
    );
};

export default CampaignCreation; 