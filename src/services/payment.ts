import { loadScript } from '@paypal/paypal-js';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { NOWPayments } from '@/lib/nowpayments';
import { generateId } from '@/utils/helpers';

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
}

interface PaymentInitializeParams {
  amount: number;
  planId: string;
  interval: 'monthly' | 'yearly';
  userId: string;
}

interface PaymentResult {
  success: boolean;
  error?: string;
  paymentUrl?: string;
  transactionId?: string;
}

class PaymentService {
  private flutterwavePublicKey: string;
  private paypalClientId: string;
  private nowpayments: NOWPayments;

  constructor() {
    this.flutterwavePublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
    this.paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    this.nowpayments = new NOWPayments(process.env.NOWPAYMENTS_API_KEY!);

    if (!this.flutterwavePublicKey || !this.paypalClientId) {
      throw new Error('Payment configuration is incomplete');
    }
  }

  async initializeFlutterwave(plan: PaymentPlan, email: string): Promise<PaymentResult> {
    try {
      // Load Flutterwave script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      document.body.appendChild(script);

      return new Promise((resolve) => {
        script.onload = () => {
          // @ts-ignore - FlutterWave types
          const FlutterwaveCheckout = window.FlutterwaveCheckout;
          
          FlutterwaveCheckout({
            public_key: this.flutterwavePublicKey,
            tx_ref: `tx-${Date.now()}`,
            amount: plan.price,
            currency: 'USD',
            payment_options: 'card,ussd,mobilemoney',
            customer: {
              email: email,
            },
            customizations: {
              title: 'Email Campaign Credits',
              description: `Purchase of ${plan.credits} email credits`,
              logo: 'https://your-logo-url.com/logo.png',
            },
            callback: (response: any) => {
              if (response.status === 'successful') {
                resolve({
                  success: true,
                  transactionId: response.transaction_id,
                });
              } else {
                resolve({
                  success: false,
                  error: 'Payment failed',
                });
              }
            },
            onclose: () => {
              resolve({
                success: false,
                error: 'Payment window closed',
              });
            },
          });
        };
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  async initializePayPal(plan: PaymentPlan): Promise<PaymentResult> {
    try {
      const paypal = await loadScript({
        'client-id': this.paypalClientId,
        currency: 'USD',
      });

      if (!paypal) {
        throw new Error('Failed to load PayPal SDK');
      }

      // @ts-ignore - PayPal types
      const buttons = paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                description: `${plan.credits} Email Credits`,
                amount: {
                  value: plan.price.toString(),
                  currency_code: 'USD',
                },
              },
            ],
          });
        },
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          return {
            success: true,
            transactionId: order.id,
          };
        },
        onError: (err: any) => {
          return {
            success: false,
            error: err.message || 'PayPal payment failed',
          };
        },
      });

      return new Promise((resolve) => {
        buttons.render('#paypal-button-container');
        resolve({
          success: true,
        });
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize PayPal',
      };
    }
  }

  getAvailablePlans(): PaymentPlan[] {
    return [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Ideal for small campaigns',
        price: 19,
        credits: 250,
        features: [
          '1,000 Email Credits',
          'Basic Templates',
          'Email Support',
          'Analytics Dashboard',
        ],
      },
      {
        id: 'grower',
        name: 'Grower',
        description: 'Perfect for growing businesses',
        price: 49,
        credits: 500,
        features: [
          '2,000 Email Credits',
          'Premium Templates',
          'Priority Support',
          'Advanced Analytics',
          'A/B Testing',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For established businesses',
        price: 99, // Placeholder price
        credits: 1000,
        features: [
          '4,000 Email Credits',
          'Premium Templates',
          'Priority Support',
          'Advanced Analytics',
          'A/B Testing',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large-scale operations',
        price: 249,
        credits: 5000,
        features: [
          '20,000 Email Credits',
          'Custom Templates',
          '24/7 Support',
          'Advanced Analytics',
          'A/B Testing',
          'Dedicated Account Manager',
        ],
      },
    ];
  }

  async initializePayment(params: PaymentInitializeParams): Promise<PaymentResult> {
    try {
      // Get user's current subscription status
      const userDoc = await getDoc(doc(db, 'users', params.userId));
      const userData = userDoc.data();

      if (userData?.subscriptionStatus === 'active') {
        return {
          success: false,
          error: 'User already has an active subscription',
        };
      }

      // Generate a unique transaction ID
      const transactionId = generateId();

      // Create payment in NOWPayments
      const paymentData = await this.nowpayments.createPayment({
        price_amount: params.amount,
        price_currency: 'USD',
        order_id: transactionId,
        order_description: `Subscription: ${params.planId} (${params.interval})`,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-webhook`,
      });

      if (!paymentData.payment_url) {
        throw new Error('Failed to generate payment URL');
      }

      // Store transaction details in Firestore
      await setDoc(doc(db, 'transactions', transactionId), {
        userId: params.userId,
        planId: params.planId,
        interval: params.interval,
        amount: params.amount,
        status: 'pending',
        provider: 'nowpayments',
        providerPaymentId: paymentData.payment_id,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        paymentUrl: paymentData.payment_url,
        transactionId,
      };
    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initialization failed',
      };
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
      const transaction = transactionDoc.data();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Verify payment status with NOWPayments
      const paymentStatus = await this.nowpayments.getPaymentStatus(transaction.providerPaymentId);

      if (paymentStatus.payment_status === 'confirmed' || paymentStatus.payment_status === 'finished') {
        // Update transaction status
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });

        // Update user subscription
        await updateDoc(doc(db, 'users', transaction.userId), {
          subscriptionStatus: 'active',
          subscriptionPlan: transaction.planId,
          subscriptionInterval: transaction.interval,
          subscriptionStartDate: new Date().toISOString(),
          subscriptionEndDate: this.calculateSubscriptionEndDate(transaction.interval),
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  private calculateSubscriptionEndDate(interval: string): string {
    const date = new Date();
    if (interval === 'monthly') {
      date.setMonth(date.getMonth() + 1);
    } else if (interval === 'yearly') {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date.toISOString();
  }

  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (!userData || userData.subscriptionStatus !== 'active') {
        return false;
      }

      await updateDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return false;
    }
  }

  async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    plan?: string;
    endDate?: string;
  }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      if (!userData) {
        return { isActive: false };
      }

      const isActive = userData.subscriptionStatus === 'active';
      return {
        isActive,
        plan: userData.subscriptionPlan,
        endDate: userData.subscriptionEndDate,
      };
    } catch (error) {
      console.error('Subscription status check failed:', error);
      return { isActive: false };
    }
  }
}

export const paymentService = new PaymentService();
export type { PaymentPlan, PaymentResult }; 