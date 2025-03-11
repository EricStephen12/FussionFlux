import { db } from '@/utils/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { apolloService } from './apollo';

export interface NichePreference {
  currentNiche: string;
  previousNiches: string[];
  lastUpdated: Date;
}

export class NicheService {
  private readonly SUPPORTED_NICHES: string[] = [
    'Trendy Clothing & Fashion',
    'Luxury Watches & Accessories',
    'Athleisure & Sportswear',
    'Designer Sunglasses',
    'Handmade Jewelry',
    'Natural Skincare Products',
    'Organic Beauty Products',
    'Hair Care & Extensions',
    'Essential Oils & Aromatherapy',
    'Vitamins & Supplements',
    'Smart Home Gadgets',
    'Kitchen Innovations',
    'Home Decor & Art',
    'Eco-Friendly Products',
    'LED Lighting & Decor',
    'Premium Pet Supplies',
    'Pet Fashion & Accessories',
    'Pet Health & Wellness',
    'Pet Tech Gadgets',
    'Phone Accessories',
    'Wireless Earbuds & Audio',
    'Smart Wearables',
    'Gaming Accessories',
    'Camera Accessories',
    'Camping & Hiking Gear',
    'Fitness Equipment',
    'Outdoor Adventure Gear',
  ];

  async getUserNiche(userId: string): Promise<NichePreference | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data() as NichePreference) : null;
  }

  async updateUserNiche(userId: string, niche: string): Promise<void> {
    if (!this.SUPPORTED_NICHES.includes(niche)) {
      throw new Error('Unsupported niche');
    }
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'nichePreference.currentNiche': niche,
      'nichePreference.lastUpdated': new Date(),
    });
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