'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService, type PaymentPlan } from '@/services/payment';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'paypal'>('flutterwave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const plans = paymentService.getAvailablePlans();

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;

    setLoading(true);
    setError('');

    try {
      const result = paymentMethod === 'flutterwave'
        ? await paymentService.initializeFlutterwave(selectedPlan, user.email || '')
        : await paymentService.initializePayPal(selectedPlan);

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // Handle successful payment
      // You might want to update user credits in Firestore here
    } catch (error: any) {
      setError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for&nbsp;you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Select a plan that best fits your email campaign needs. All plans include access to our
          powerful campaign management tools.
        </p>

        {error && (
          <div className="mt-6 text-center">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 ${
                  isSelected ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {plan.name}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-gray-600">{plan.description}</p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-sm font-semibold leading-6 text-gray-600">/mo</span>
                  </p>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select plan'}
                  </button>
                </div>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckIcon
                        className="h-6 w-5 flex-none text-indigo-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="mt-12 text-center">
            <div className="mb-6">
              <label className="text-base font-semibold text-gray-900">Payment Method</label>
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${
                    paymentMethod === 'flutterwave'
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-600 ring-1 ring-inset ring-indigo-200'
                  }`}
                >
                  Flutterwave
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${
                    paymentMethod === 'paypal'
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-600 ring-1 ring-inset ring-indigo-200'
                  }`}
                >
                  PayPal
                </button>
              </div>
            </div>

            {paymentMethod === 'paypal' && (
              <div id="paypal-button-container" className="mt-6" />
            )}

            {paymentMethod === 'flutterwave' && (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 