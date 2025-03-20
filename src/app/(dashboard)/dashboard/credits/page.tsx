// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/payment';
import { Slider } from '@/components/ui/Slider';
import { InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function PurchaseCreditsPage() {
  const searchParams = useSearchParams();
  const creditType = searchParams.get('type') || 'leads';
  const { user } = useAuth();
  const { subscription, subscriptionTiers } = useSubscription();
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'paypal' | 'nowpayments'>('flutterwave');
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<string>('BTC');
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'MATIC'];
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState<{
    address: string;
    amount: number;
    currency: string;
    status: string;
  } | null>(null);

  const currentTier = subscription?.tier || 'free';
  const tierInfo = subscriptionTiers[currentTier];

  const getUnitPrice = () => {
    switch (creditType) {
      case 'leads':
        return tierInfo?.extraLeadsPrice || 0.06;
      case 'sms':
        return tierInfo?.extraSMSPrice || 0.03;
      case 'emails':
        return tierInfo?.extraEmailPrice || 0.004;
      default:
        return 0;
    }
  };

  const calculatePrice = () => {
    const unitPrice = getUnitPrice();
    const basePrice = quantity * unitPrice;
    let discount = 0;

    // Apply bulk discounts
    if (quantity >= 10000) discount = basePrice * 0.2; // 20% off for 10k+
    else if (quantity >= 5000) discount = basePrice * 0.15; // 15% off for 5k+
    else if (quantity >= 1000) discount = basePrice * 0.1; // 10% off for 1k+

    const finalPrice = basePrice - discount;
    return {
      basePrice,
      discount,
      finalPrice,
      pricePerCredit: finalPrice / quantity
    };
  };

  // Add PayPal script loading
  useEffect(() => {
    let paypalScript: HTMLScriptElement | null = null;
    
    if (paymentMethod === 'paypal') {
      // Remove any existing PayPal scripts first
      const existingScript = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`);
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }

      // Create and add new script
      paypalScript = document.createElement('script');
      paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
      paypalScript.async = true;
      paypalScript.onload = () => {
        if (window.paypal && user?.email) {
          window.paypal.Buttons({
            createOrder: async () => {
              try {
                const priceDetails = calculatePrice();
                const response = await paymentService.initializePayPal({
                  price: priceDetails.finalPrice,
                  currency: 'USD',
                  customer: {
                    email: user.email,
                    name: user.displayName || user.email,
                    userId: user.uid
                  },
                  meta: {
                    planId: `extra_${creditType.toLowerCase()}`,
                    creditType,
                    quantity,
                    maxEmails: creditType === 'emails' ? quantity : 0,
                    maxSMS: creditType === 'sms' ? quantity : 0,
                    limits: creditType === 'leads' ? quantity : 0
                  },
                  description: `Purchase of ${quantity} ${creditType} credits`
                });
                
                if (!response.success) {
                  throw new Error(response.error || 'Failed to create PayPal order');
                }
                return response.orderId;
              } catch (error) {
                console.error('PayPal create order error:', error);
                setError('Failed to create PayPal order');
                return null;
              }
            },
            onApprove: async (data: any) => {
              try {
                setLoading(true);
                // Handle successful payment
                await paymentService.verifyPayment(data.orderID);
                setSuccessMessage('Payment successful! Credits will be added to your account.');
              } catch (error) {
                console.error('PayPal approval error:', error);
                setError('Failed to process PayPal payment');
              } finally {
                setLoading(false);
              }
            },
            onError: (err: any) => {
              console.error('PayPal error:', err);
              setError('PayPal payment failed. Please try again.');
            }
          }).render('#paypal-button-container');
        }
      };
      document.head.appendChild(paypalScript);
    }

    return () => {
      if (paypalScript && paypalScript.parentNode) {
        paypalScript.parentNode.removeChild(paypalScript);
      }
    };
  }, [paymentMethod, quantity, creditType, user]);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      if (!user?.email) {
        throw new Error('User email is required for payment');
      }

      const priceDetails = calculatePrice();
      
      let paymentResult;
      console.log('Initializing payment with method:', paymentMethod);

      switch (paymentMethod) {
        case 'flutterwave':
          // Get the latest price calculation
          const currentPrice = calculatePrice();
          const flutterwaveAmount = Number(currentPrice.finalPrice.toFixed(2));
          
          if (isNaN(flutterwaveAmount) || flutterwaveAmount <= 0) {
            throw new Error('Invalid amount for payment');
          }

          // Show confirmation dialog with the final amount
          if (!window.confirm(`Confirm payment of $${flutterwaveAmount} for ${quantity} ${creditType}?`)) {
            setLoading(false);
            return;
          }

          paymentResult = await paymentService.initializeFlutterwave({
            amount: flutterwaveAmount,
            customer_email: user.email,
            customer_name: user.displayName || user.email,
            tx_ref: `credit_${Date.now()}`,
            currency: 'USD',
            payment_options: 'card',
            meta: {
              userId: user.uid,
              creditType,
              quantity,
              maxEmails: creditType === 'emails' ? quantity : 0,
              maxSMS: creditType === 'sms' ? quantity : 0,
              limits: creditType === 'leads' ? quantity : 0
            }
          });
          break;

        case 'paypal':
          return;

        case 'nowpayments':
          paymentResult = await paymentService.initializeNOWPayments({
            price_amount: priceDetails.finalPrice,
            price_currency: 'USD',
            pay_currency: selectedCryptoCurrency,
            order_id: `credit_${Date.now()}`,
            order_description: `Purchase of ${quantity} ${creditType} credits`,
            customer: {
              email: user.email,
              name: user.displayName || user.email
            },
            meta: {
              userId: user.uid,
              creditType,
              quantity,
              maxEmails: creditType === 'emails' ? quantity : 0,
              maxSMS: creditType === 'sms' ? quantity : 0,
              limits: creditType === 'leads' ? quantity : 0
            }
          });
          break;

        default:
          throw new Error('Invalid payment method');
      }

      console.log('Payment result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment initialization failed');
      }

      if (paymentResult.provider === 'nowpayments' && paymentResult.cryptoDetails) {
        setCryptoPaymentDetails(paymentResult.cryptoDetails);
        setShowCryptoPayment(true);
      } else if (paymentResult.paymentUrl) {
        if (paymentMethod === 'flutterwave') {
          const redirectUrl = new URL(paymentResult.paymentUrl);
          redirectUrl.searchParams.append('redirect_url', window.location.href);
          window.location.href = redirectUrl.toString();
        } else {
          window.location.href = paymentResult.paymentUrl;
        }
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      setError(error.message || 'Failed to process purchase');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Extra Credits</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add more {creditType} credits to your account
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Quantity
                </label>
                <Slider
                  min={100}
                  max={50000}
                  step={100}
                  value={quantity}
                  onChange={setQuantity}
                  className="w-full"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900">Price Details</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base Price</span>
                    <span className="text-gray-900">${calculatePrice().basePrice.toFixed(2)}</span>
                  </div>
                  {calculatePrice().discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bulk Discount</span>
                      <span className="text-green-600">-${calculatePrice().discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-1 mt-1">
                    <span className="text-gray-900">Final Price</span>
                    <span className="text-gray-900">${calculatePrice().finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${calculatePrice().pricePerCredit.toFixed(3)} per credit
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('flutterwave')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      paymentMethod === 'flutterwave'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      Flutterwave
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      paymentMethod === 'paypal'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      PayPal
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nowpayments')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      paymentMethod === 'nowpayments'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      Crypto
                    </span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'nowpayments' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cryptocurrency
                  </label>
                  <select
                    value={selectedCryptoCurrency}
                    onChange={(e) => setSelectedCryptoCurrency(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {cryptoCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}

              {paymentMethod === 'paypal' ? (
                <div id="paypal-button-container" className="mt-4"></div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Purchase Credits'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Selected Credits</p>
                <p className="text-base font-medium text-gray-900">
                  {quantity.toLocaleString()} {creditType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Price</p>
                <p className="text-base font-medium text-gray-900">
                  ${getUnitPrice()} per credit
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Price</p>
                <p className="text-lg font-semibold text-indigo-600">
                  ${calculatePrice().finalPrice.toFixed(2)}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Credits will expire in 30 days from purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCryptoPayment && cryptoPaymentDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complete Crypto Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Send {cryptoPaymentDetails.amount} {cryptoPaymentDetails.currency}
                </label>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={cryptoPaymentDetails.address}
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(cryptoPaymentDetails.address)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please send the exact amount to complete your purchase. The payment will be confirmed automatically once received.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowCryptoPayment(false);
                    setCryptoPaymentDetails(null);
                  }}
                  className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 