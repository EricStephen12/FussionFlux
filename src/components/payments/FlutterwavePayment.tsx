import React, { useState } from 'react';
import { PaymentService } from '@/services/payment';

interface FlutterwavePaymentProps {
  plan: any;
  email: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

const FlutterwavePayment: React.FC<FlutterwavePaymentProps> = ({
  plan,
  email,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState(plan.price);
  const [isConfirming, setIsConfirming] = useState(false);
  const paymentService = new PaymentService();

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(event.target.value);
    setAmount(newAmount);
  };

  const handleConfirmAmount = async () => {
    try {
      setIsConfirming(true);
      const result = await paymentService.initializeFlutterwave(
        { ...plan, price: amount },
        email
      );

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.error || 'Payment failed');
      }
    } catch (error) {
      onError?.('An error occurred while processing payment');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="amount" className="text-sm font-medium text-gray-700">
          Select Amount
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            id="amount"
            min={plan.price * 0.5}
            max={plan.price * 2}
            step={1}
            value={amount}
            onChange={handleAmountChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-lg font-semibold text-gray-900">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleConfirmAmount}
        disabled={isConfirming}
        className={`w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isConfirming ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isConfirming ? 'Processing...' : 'Confirm Amount & Pay'}
      </button>
    </div>
  );
};

export default FlutterwavePayment; 