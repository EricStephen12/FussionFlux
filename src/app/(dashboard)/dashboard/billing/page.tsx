'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, type Transaction } from '@/services/firestore';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatPaymentMethod(method: string) {
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export default function BillingHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const userTransactions = await firestoreService.getUserTransactions(user!.uid);
      setTransactions(userTransactions);
    } catch (error: any) {
      setError(error.message || 'Failed to load transactions');
      console.error('Error loading transactions:', error);
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

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Billing History</h1>
        <p className="mt-2 text-sm text-gray-700">
          View your past transactions and payment history
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <li key={transaction.transactionId}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {transaction.planId.charAt(0).toUpperCase() + transaction.planId.slice(1)} Plan
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Transaction ID: {transaction.transactionId}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {formatPaymentMethod(transaction.paymentMethod)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {transaction.credits.toLocaleString()} Credits
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>{formatDate(transaction.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li>
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No transactions found</p>
              </div>
            </li>
          )}
        </ul>
      </div>

      {transactions.length > 0 && (
        <div className="mt-4 text-right">
          <p className="text-sm text-gray-500">
            Total Transactions: {transactions.length}
          </p>
          <p className="text-sm text-gray-500">
            Total Credits Purchased:{' '}
            {transactions
              .reduce((total, t) => total + t.credits, 0)
              .toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
} 