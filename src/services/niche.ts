import { db } from '@/utils/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { apolloService } from './apollo';

export interface NichePreference {
  currentNiche: string;
  previousNiches: string[];
  lastUpdated: Date;
}

class NicheService {
  private readonly SUPPORTED_NICHES = [
    'Fashion & Apparel',
    'Home & Garden',
    'Electronics & Gadgets',
    'Health & Beauty',
    'Sports & Fitness',
    'Toys & Games',
    'Pet Supplies',
    'Jewelry & Accessories',
    'Office Supplies',
    'Automotive',
  ];

  async updateUserNiche(userId: string, newNiche: string): Promise<boolean> {
    try {
      if (!this.SUPPORTED_NICHES.includes(newNiche)) {
        throw new Error('Invalid niche selected');
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentData = userDoc.data();
      const currentNiche = currentData.nichePreference?.currentNiche;
      
      // Update niche preference
      await updateDoc(userRef, {
        nichePreference: {
          currentNiche: newNiche,
          previousNiches: currentNiche 
            ? [...(currentData.nichePreference?.previousNiches || []), currentNiche]
            : [],
          lastUpdated: new Date(),
        },
      });

      // Refresh email lists for active campaigns
      const campaignsRef = collection(db, 'campaigns');
      const activeCampaigns = await getDocs(
        query(
          campaignsRef,
          where('userId', '==', userId),
          where('status', 'in', ['draft', 'scheduled'])
        )
      );

      // Update email lists for each campaign
      const updatePromises = activeCampaigns.docs.map(async (campaign) => {
        const campaignData = campaign.data();
        const newContacts = await apolloService.searchContacts({
          niche: newNiche,
          count: campaignData.totalEmails,
        });

        return updateDoc(doc(campaignsRef, campaign.id), {
          contacts: newContacts,
          updatedAt: new Date(),
        });
      });

      await Promise.all(updatePromises);

      return true;
    } catch (error) {
      console.error('Error updating niche:', error);
      return false;
    }
  }

  async getUserNiche(userId: string): Promise<NichePreference | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data().nichePreference || null;
    } catch (error) {
      console.error('Error getting user niche:', error);
      return null;
    }
  }

  getSupportedNiches(): string[] {
    return [...this.SUPPORTED_NICHES];
  }

  async refreshEmailList(userId: string, campaignId: string): Promise<boolean> {
    try {
      const userNiche = await this.getUserNiche(userId);
      if (!userNiche) {
        throw new Error('No niche preference found');
      }

      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignDoc = await getDoc(campaignRef);
      
      if (!campaignDoc.exists()) {
        throw new Error('Campaign not found');
      }

      const campaignData = campaignDoc.data();
      const newContacts = await apolloService.searchContacts({
        niche: userNiche.currentNiche,
        count: campaignData.totalEmails,
      });

      await updateDoc(campaignRef, {
        contacts: newContacts,
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('Error refreshing email list:', error);
      return false;
    }
  }
}

export const nicheService = new NicheService(); 