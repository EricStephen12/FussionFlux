import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CREDIT_CONFIG } from '@/services/trial';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PriceDetails {
  basePrice: number;
  discount: number;
  finalPrice: number;
  pricePerCredit: number;
}

function CreditPurchaseForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [amount, setAmount] = useState<number>(CREDIT_CONFIG.EXTRA_CREDITS[type].MIN_PURCHASE);
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'paypal' | 'nowpayments'>('flutterwave');

  const handleTypeChange = (newType: 'EMAIL' | 'SMS') => {
    setType(newType);
    setAmount(CREDIT_CONFIG.EXTRA_CREDITS[newType].MIN_PURCHASE);
    setPriceDetails(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value);
    if (!isNaN(newAmount)) {
      setAmount(newAmount);
      setPriceDetails(null);
    }
  };

  const calculatePrice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the credit service to calculate price
      const price = CREDIT_CONFIG.EXTRA_CREDITS[type].PRICE_PER_CREDIT * amount;
      let discount = 0;

      // Calculate bulk discount if applicable
      for (const tier of CREDIT_CONFIG.EXTRA_CREDITS[type].BULK_DISCOUNTS.sort((a, b) => b.amount - a.amount)) {
        if (amount >= tier.amount) {
          discount = price * tier.discount;
          break;
        }
      }

      const finalPrice = price - discount;
      setPriceDetails({
        basePrice: price,
        discount,
        finalPrice,
        pricePerCredit: finalPrice / amount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!priceDetails) {
        throw new Error('Please calculate price first');
      }

      // Check subscription limits before proceeding
      const { subscription } = useSubscription();
      const maxCredits = subscription ? subscription.maxEmails : 0; // Example for email credits
      if (amount + subscription.usageStats.usedEmails > maxCredits) {
        throw new Error('You have exceeded your email credit limit. Please purchase additional credits.');
      }

      // Create transaction record
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: Date.now().toString(), // You should generate this properly
          paymentMethod,
          planId: `extra_credits_${type.toLowerCase()}`,
          amount: priceDetails.finalPrice,
          credits: {
            type: type.toLowerCase(),
            amount: amount
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process payment');
      }

      const data = await response.json();
      
      // Reset form on success
      setPriceDetails(null);
      setAmount(CREDIT_CONFIG.EXTRA_CREDITS[type].MIN_PURCHASE);
      
      // Show success message
      alert('Credits purchased successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Purchase Extra Credits</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit Type
        </label>
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-md ${
              type === 'EMAIL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleTypeChange('EMAIL')}
          >
            Email Credits
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              type === 'SMS'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handleTypeChange('SMS')}
          >
            SMS Credits
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <input
          type="number"
          min={CREDIT_CONFIG.EXTRA_CREDITS[type].MIN_PURCHASE}
          value={amount}
          onChange={handleAmountChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <p className="mt-1 text-sm text-gray-500">
          Minimum purchase: {CREDIT_CONFIG.EXTRA_CREDITS[type].MIN_PURCHASE} credits
        </p>
      </div>

      {!priceDetails && (
        <button
          onClick={calculatePrice}
          disabled={loading || amount < CREDIT_CONFIG.EXTRA_CREDITS[type].MIN_PURCHASE}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Calculating...' : 'Calculate Price'}
        </button>
      )}

      {priceDetails && (
        <>
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Price Details</h3>
            <div className="space-y-1 text-sm">
              <p>Base Price: ${priceDetails.basePrice.toFixed(2)}</p>
              <p>Discount: ${priceDetails.discount.toFixed(2)}</p>
              <p className="font-medium">
                Final Price: ${priceDetails.finalPrice.toFixed(2)}
              </p>
              <p className="text-gray-500">
                Price per credit: ${priceDetails.pricePerCredit.toFixed(3)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="flutterwave">Flutterwave</option>
              <option value="paypal">PayPal</option>
              <option value="nowpayments">NowPayments</option>
            </select>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Purchase Credits'}
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}

export default function PurchaseCredits() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="text-center p-6">
        Please sign in to purchase credits
      </div>
    );
  }

  return <CreditPurchaseForm />;
} 