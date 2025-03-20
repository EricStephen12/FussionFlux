'use client';

import { useState, useEffect } from 'react';
import { firestoreService } from '@/services/firestore';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/hooks/useSubscription';

interface Promotion {
  id: string;
  tier: string;
  discountPercentage: number;
  durationMonths: number;
  bonusAmount: number;
  bonusFeatures: string[];
  expiryDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  trackingCode?: string;
}

export default function PromotionsPage() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    tier: 'starter',
    discountPercentage: 50,
    durationMonths: 3,
    bonusAmount: 500,
    bonusFeatures: ['Unlimited Email Templates', 'AI Copywriting Credits', 'Priority Support'],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    enabled: true,
    trackingCode: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadPromotions();
    }
  }, [user]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const promotionsRef = collection(firestoreService.db, 'promotions');
      const snapshot = await firestoreService.getDocuments(promotionsRef);
      const promotionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Promotion[];
      
      setPromotions(promotionsList);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    try {
      if (!newPromotion.tier || !newPromotion.expiryDate) {
        toast.error('Please fill all required fields');
        return;
      }

      const promotionData: Omit<Promotion, 'id'> = {
        ...newPromotion as Omit<Promotion, 'id'>,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const promotionsRef = collection(firestoreService.db, 'promotions');
      const docRef = doc(promotionsRef);
      await setDoc(docRef, promotionData);

      // Also update the subscription tier in a "specialOffers" collection for dynamic loading
      const specialOffersRef = collection(firestoreService.db, 'specialOffers');
      const tierDoc = doc(specialOffersRef, newPromotion.tier);
      await setDoc(tierDoc, {
        enabled: newPromotion.enabled,
        discountPercentage: newPromotion.discountPercentage,
        durationMonths: newPromotion.durationMonths,
        bonusAmount: newPromotion.bonusAmount,
        bonusFeatures: newPromotion.bonusFeatures,
        expiryDate: newPromotion.expiryDate,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Promotion created successfully');
      setIsCreating(false);
      loadPromotions();
      
      // Reset form
      setNewPromotion({
        tier: 'starter',
        discountPercentage: 50,
        durationMonths: 3,
        bonusAmount: 500,
        bonusFeatures: ['Unlimited Email Templates', 'AI Copywriting Credits', 'Priority Support'],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        enabled: true,
        trackingCode: '',
      });
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Failed to create promotion');
    }
  };

  const handleTogglePromotion = async (id: string, currentState: boolean) => {
    try {
      const promotionRef = doc(firestoreService.db, 'promotions', id);
      await updateDoc(promotionRef, {
        enabled: !currentState,
        updatedAt: new Date().toISOString(),
      });

      // Also update in specialOffers collection
      const promotion = promotions.find(p => p.id === id);
      if (promotion) {
        const specialOffersRef = doc(firestoreService.db, 'specialOffers', promotion.tier);
        await updateDoc(specialOffersRef, {
          enabled: !currentState,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success(`Promotion ${!currentState ? 'enabled' : 'disabled'} successfully`);
      loadPromotions();
    } catch (error) {
      console.error('Error toggling promotion:', error);
      toast.error('Failed to update promotion');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPromotion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBonusFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const features = e.target.value.split('\n').filter(feature => feature.trim() !== '');
    setNewPromotion(prev => ({
      ...prev,
      bonusFeatures: features
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Promotional Offers</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {isCreating ? (
            <>
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Promotion
            </>
          )}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Promotion</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Tier
              </label>
              <select
                name="tier"
                value={newPromotion.tier}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Object.keys(SUBSCRIPTION_TIERS)
                  .filter(tier => tier !== 'free')
                  .map(tier => (
                    <option key={tier} value={tier}>
                      {SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS].name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Percentage
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={newPromotion.discountPercentage}
                onChange={handleChange}
                min="1"
                max="100"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Months)
              </label>
              <input
                type="number"
                name="durationMonths"
                value={newPromotion.durationMonths}
                onChange={handleChange}
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Amount ($ Value)
              </label>
              <input
                type="number"
                name="bonusAmount"
                value={newPromotion.bonusAmount}
                onChange={handleChange}
                min="0"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                name="expiryDate"
                value={newPromotion.expiryDate}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking Code (Optional)
              </label>
              <input
                type="text"
                name="trackingCode"
                value={newPromotion.trackingCode}
                onChange={handleChange}
                placeholder="SUMMER2025"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Features (One per line)
              </label>
              <textarea
                rows={3}
                value={newPromotion.bonusFeatures?.join('\n')}
                onChange={handleBonusFeaturesChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Unlimited Email Templates
AI Copywriting Credits
Priority Support"
              />
            </div>

            <div className="md:col-span-2 flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={newPromotion.enabled}
                onChange={(e) => setNewPromotion(prev => ({ ...prev, enabled: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Enable this promotion
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsCreating(false)}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePromotion}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Promotion
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading promotions...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No promotions found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by creating a new promotional offer.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => {
                const isExpired = new Date(promotion.expiryDate) < new Date();
                
                return (
                  <tr key={promotion.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {SUBSCRIPTION_TIERS[promotion.tier as keyof typeof SUBSCRIPTION_TIERS]?.name || promotion.tier}
                      </div>
                      {promotion.trackingCode && (
                        <div className="text-xs text-gray-500">
                          Code: {promotion.trackingCode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{promotion.discountPercentage}% Off</div>
                      <div className="text-xs text-gray-500">${promotion.bonusAmount} bonus value</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {promotion.durationMonths} {promotion.durationMonths === 1 ? 'month' : 'months'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(promotion.expiryDate).toLocaleDateString()}
                      </div>
                      {isExpired && (
                        <div className="text-xs text-red-500">Expired</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promotion.enabled && !isExpired
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promotion.enabled && !isExpired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleTogglePromotion(promotion.id, promotion.enabled)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                          promotion.enabled
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {promotion.enabled ? (
                          <>
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 