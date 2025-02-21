import { db } from '@/utils/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { sendGridService } from './sendgrid';
import type { Campaign } from './firestore';

interface ScheduleConfig {
  campaignId: string;
  scheduledTime: Date;
  batchSize?: number;
  timeZone?: string;
}

class SchedulerService {
  private readonly OPTIMAL_SEND_TIMES = [
    9,  // 9 AM
    11, // 11 AM
    14, // 2 PM
    16, // 4 PM
    20, // 8 PM
  ];

  private readonly DEFAULT_BATCH_SIZE = 50;

  async scheduleCampaign(config: ScheduleConfig): Promise<boolean> {
    try {
      const { campaignId, scheduledTime, batchSize = this.DEFAULT_BATCH_SIZE } = config;
      
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDocs(campaignRef);
      
      if (!campaignDoc.exists()) {
        throw new Error('Campaign not found');
      }

      // Update campaign with schedule information
      await updateDoc(campaignRef, {
        status: 'scheduled',
        scheduledFor: Timestamp.fromDate(scheduledTime),
        batchSize,
        lastProcessed: null,
      });

      return true;
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      return false;
    }
  }

  async processScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date();
      const campaignsRef = collection(db, 'campaigns');
      
      // Get all campaigns scheduled for now or earlier
      const scheduledCampaigns = await getDocs(
        query(
          campaignsRef,
          where('status', '==', 'scheduled'),
          where('scheduledFor', '<=', Timestamp.fromDate(now))
        )
      );

      for (const campaignDoc of scheduledCampaigns.docs) {
        const campaign = { id: campaignDoc.id, ...campaignDoc.data() } as Campaign;
        
        // Get unsent contacts
        const sentCount = campaign.sentCount || 0;
        const remainingContacts = campaign.contacts.slice(sentCount);
        
        if (remainingContacts.length === 0) {
          // Campaign completed
          await updateDoc(doc(campaignsRef, campaign.id), {
            status: 'completed',
            completedAt: Timestamp.fromDate(now),
          });
          continue;
        }

        // Send next batch
        const batchContacts = remainingContacts.slice(0, campaign.batchSize || this.DEFAULT_BATCH_SIZE);
        let successCount = 0;

        for (const contact of batchContacts) {
          const success = await sendGridService.sendEmail({
            to: contact,
            templateId: campaign.templateId,
            campaignId: campaign.id,
            dynamicTemplateData: {
              unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${contact.email}&campaign=${campaign.id}`,
            },
          });

          if (success) successCount++;
        }

        // Update campaign progress
        await updateDoc(doc(campaignsRef, campaign.id), {
          sentCount: sentCount + successCount,
          lastProcessed: Timestamp.fromDate(now),
        });
      }
    } catch (error) {
      console.error('Error processing scheduled campaigns:', error);
    }
  }

  async getOptimalSendTime(userId: string): Promise<Date> {
    // Placeholder logic for determining optimal send time based on user engagement
    // In a real implementation, this would analyze past engagement data
    const currentHour = new Date().getHours();
    const optimalHour = this.OPTIMAL_SEND_TIMES.find(time => time > currentHour) || this.OPTIMAL_SEND_TIMES[0];
    const optimalSendTime = new Date();
    optimalSendTime.setHours(optimalHour, 0, 0, 0);
    return optimalSendTime;
  }

  async scheduleCampaignWithDynamicTime(config: ScheduleConfig): Promise<boolean> {
    try {
      const optimalSendTime = await this.getOptimalSendTime(config.campaignId);
      return this.scheduleCampaign({ ...config, scheduledTime: optimalSendTime });
    } catch (error) {
      console.error('Error scheduling campaign with dynamic time:', error);
      return false;
    }
  }

  async pauseScheduledCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'paused',
        pausedAt: Timestamp.fromDate(new Date()),
      });
      return true;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      return false;
    }
  }

  async resumeScheduledCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDocs(campaignRef);
      
      if (!campaignDoc.exists()) {
        throw new Error('Campaign not found');
      }

      const campaign = campaignDoc.data();
      const nextSendTime = await this.getOptimalSendTime(campaign.campaignId);

      await updateDoc(campaignRef, {
        status: 'scheduled',
        scheduledFor: Timestamp.fromDate(nextSendTime),
        resumedAt: Timestamp.fromDate(new Date()),
      });

      return true;
    } catch (error) {
      console.error('Error resuming campaign:', error);
      return false;
    }
  }
}

export const schedulerService = new SchedulerService();
export type { ScheduleConfig }; 