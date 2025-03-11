import { loadScript } from '@paypal/paypal-js';
import { db } from '@/utils/firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { NOWPaymentsService } from '@/services/nowpayments';
import { LeadPack } from './LeadService'; // Import the LeadPack interface

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  limits: number;
  features: string[];
  amount: number;
  planId: string;
  interval: 'monthly' | 'yearly';
  userId?: string;
  maxEmails: number;
  maxSMS: number;
}

interface PaymentInitializeParams {
  amount: number;
  planId: string;
  interval: 'monthly' | 'yearly';
  userId: string;
  currency: string;
  cryptoCurrency?: string;
  orderId: string;
}

interface PaymentResult {
  success: boolean;
  error?: string;
  paymentUrl?: string;
  transactionId?: string;
  paymentId?: string;
  provider: string;
  cryptoDetails?: {
    address: string;
    amount: number;
    currency: string;
    status: string;
  };
}

class PaymentService {
  private flutterwavePublicKey: string;
  private paypalClientId: string;
  private nowPaymentsService: NOWPaymentsService;

  constructor() {
    this.flutterwavePublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
    this.paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    
    const nowPaymentsKey = process.env.NEXT_PUBLIC_NOWPAYMENTS_API_KEY;
    if (!nowPaymentsKey) {
      console.warn('NOWPayments API key is missing. Crypto payments will be unavailable.');
    }
    this.nowPaymentsService = new NOWPaymentsService(nowPaymentsKey || '');

    // Only check for required payment methods
    if (!this.flutterwavePublicKey || !this.paypalClientId) {
      console.warn('Some payment methods may be unavailable due to missing configuration');
    }
  }

  private get headers() {
    if (!this.flutterwavePublicKey) {
      throw new Error('Flutterwave public key is required for this operation');
    }
    return {
      'Authorization': `Bearer ${this.flutterwavePublicKey}`
    };
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
              description: `Purchase of ${plan.limits} email credits`,
              logo: 'https://your-logo-url.com/logo.png',
            },
            callback: (response: any) => {
              if (response.status === 'successful') {
                resolve({
                  success: true,
                  paymentUrl: response.payment_url,
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
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=' + this.paypalClientId;
        script.async = true;
        document.body.appendChild(script);

        return new Promise((resolve) => {
            script.onload = async () => {
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
                                    description: `${plan.limits} Email Credits`,
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
                        resolve({
                            success: true,
                            paymentUrl: order.links.find((link: any) => link.rel === 'approval_url').href,
                            transactionId: order.id,
                        });
                    },
                    onError: (err: any) => {
                        resolve({
                            success: false,
                            error: err.message || 'PayPal payment failed',
                        });
                    },
                });

                buttons.render('#paypal-button-container');
            };

            script.onerror = () => {
                resolve({
                    success: false,
                    error: 'Failed to load PayPal script',
                });
            };
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
        id: 'free',
        name: 'Free Trial',
        description: 'Ideal for small campaigns',
        price: 19,
        limits: 250,
        features: [
          '1,000 Email Credits',
          'Basic Templates',
          'Email Support',
          'Analytics Dashboard',
        ],
        amount: 19,
        planId: 'free',
        interval: 'monthly',
        maxEmails: 500,
        maxSMS: 100,
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for growing businesses',
        price: 49,
        limits: 500,
        features: [
          '2,000 Email Credits',
          'Premium Templates',
          'Priority Support',
          'Advanced Analytics',
          'A/B Testing',
        ],
        amount: 49,
        planId: 'starter',
        interval: 'monthly',
        maxEmails: 5000,
        maxSMS: 1000,
      },
      {
        id: 'grower',
        name: 'Grower',
        description: 'Perfect for growing businesses',
        price: 49,
        limits: 500,
        features: [
          '2,000 Email Credits',
          'Premium Templates',
          'Priority Support',
          'Advanced Analytics',
          'A/B Testing',
        ],
        amount: 49,
        planId: 'grower',
        interval: 'monthly',
        maxEmails: 25000,
        maxSMS: 5000,
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For established businesses',
        price: 99, // Placeholder price
        limits: 1000,
        features: [
          '4,000 Email Credits',
          'Premium Templates',
          'Priority Support',
          'Advanced Analytics',
          'A/B Testing',
        ],
        amount: 99,
        planId: 'pro',
        interval: 'monthly',
        maxEmails: 100000,
        maxSMS: 20000,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large-scale operations',
        price: 249,
        limits: 5000,
        features: [
          '20,000 Email Credits',
          'Custom Templates',
          '24/7 Support',
          'Advanced Analytics',
          'A/B Testing',
          'Dedicated Account Manager',
        ],
        amount: 249,
        planId: 'enterprise',
        interval: 'monthly',
        maxEmails: 20000,
        maxSMS: 5000,
      },
    ];
  }

  async initializeNOWPayments(params: PaymentInitializeParams): Promise<PaymentResult> {
    try {
      console.log('Initializing NOWPayments with params:', params);
      const paymentParams = {
            price_amount: params.amount,
        price_currency: params.currency,
        pay_currency: params.cryptoCurrency || 'BTC',
        order_id: params.orderId,
        order_description: `Subscription: ${params.planId}`,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/nowpayments/webhook`
      };

      const payment = await this.nowPaymentsService.createPayment(paymentParams);
      
      // For crypto payments, we'll return the payment details instead of a URL
      return {
        success: true,
        paymentId: payment.payment_id,
        provider: 'nowpayments',
        cryptoDetails: {
          address: payment.pay_address,
          amount: payment.pay_amount,
          currency: payment.pay_currency,
          status: payment.payment_status
        }
        };
    } catch (error: any) {
      console.error('NOWPayments initialization error:', error);
        return {
            success: false,
        error: error.response?.data?.message || error.message || 'Failed to initialize crypto payment',
        provider: 'nowpayments'
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
      const paymentStatus = await this.nowPaymentsService.getPaymentStatus(transaction.providerPaymentId);

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

  async simulatePayment(planId: string, userId: string): Promise<PaymentResult> {
    try {
        // Simulate a successful payment
        const simulatedResult = {
            success: true,
            paymentUrl: 'https://mock-payment-url.com',
            transactionId: 'mock-transaction-id',
        };

        // Log the simulated payment
        console.log(`Simulated payment for plan: ${planId}, user: ${userId}`, simulatedResult);
        return simulatedResult;
    } catch (error) {
        console.error('Simulated payment error:', error);
        return { success: false, error: 'Simulated payment failed' };
    }
  }

  async downgradeSubscription(userId: string): Promise<boolean> {
    try {
      // Logic to downgrade the user's subscription in the database
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        subscriptionStatus: 'starter', // Change to the desired tier
        // Add any other necessary fields to update
      });
      return true;
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      return false;
    }
  }

  async upgradeSubscription(userId: string, planId: string): Promise<boolean> {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            subscriptionStatus: 'active',
            subscriptionPlan: planId,
            subscriptionStartDate: new Date().toISOString(),
            subscriptionEndDate: this.calculateSubscriptionEndDate('monthly'), // Assuming monthly for simplicity
        });
        return true;
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        return false;
    }
  }

  private calculateDiscountedPrice(plan: PaymentPlan): number {
    const tier = SUBSCRIPTION_TIERS[plan.planId];
    if (tier?.specialOffer?.enabled) {
      const discountMultiplier = 1 - (tier.specialOffer.discountPercentage / 100);
      return plan.price * discountMultiplier;
    }
    return plan.price;
  }

  async initializePayment(plan: PaymentPlan, email: string): Promise<PaymentResult> {
    try {
      const discountedPrice = this.calculateDiscountedPrice(plan);
      const tier = SUBSCRIPTION_TIERS[plan.planId];
      
      // Add special offer bonuses if applicable
      const bonuses = tier?.specialOffer?.enabled ? {
        bonusAmount: tier.specialOffer.bonusAmount,
        bonusFeatures: tier.specialOffer.bonusFeatures,
        discountDuration: tier.specialOffer.durationMonths
      } : undefined;

      // Initialize payment with provider
      const result = await this.initializeFlutterwave({
        ...plan,
        price: discountedPrice,
        email,
        metadata: {
          specialOffer: bonuses,
          originalPrice: plan.price
        }
      });

      return result;
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) return false;

      // Apply special offer benefits if applicable
      if (transaction.metadata?.specialOffer) {
        await this.applySpecialOfferBenefits(
          transaction.userId,
          transaction.metadata.specialOffer
        );
      }

      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  private async applySpecialOfferBenefits(
    userId: string,
    specialOffer: {
      bonusAmount: number;
      bonusFeatures: string[];
      discountDuration: number;
    }
  ) {
    try {
      // Add bonus credits
      await this.addBonusCredits(userId, specialOffer.bonusAmount);

      // Set discount duration
      await this.setDiscountPeriod(userId, specialOffer.discountDuration);

      // Enable bonus features
      await this.enableBonusFeatures(userId, specialOffer.bonusFeatures);
    } catch (error) {
      console.error('Error applying special offer benefits:', error);
      throw error;
    }
  }

  private async addBonusCredits(userId: string, amount: number) {
    // Implementation to add bonus credits
  }

  private async setDiscountPeriod(userId: string, months: number) {
    // Implementation to set discount period
  }

  private async enableBonusFeatures(userId: string, features: string[]) {
    // Implementation to enable bonus features
  }
}

export const paymentService = new PaymentService();
export type { PaymentPlan, PaymentResult };

const paymentMethods = [
  { id: 'flutterwave', name: 'Flutterwave', logo: '/images/flutterwave-logo.png', description: 'Pay with Flutterwave' },
  { id: 'paypal', name: 'PayPal', logo: '/images/paypal-logo.png', description: 'Pay with PayPal' },
  { id: 'nowpayments', name: 'NowPayments', logo: '/images/nowpayments-logo.png', description: 'Pay with NowPayments' },
];

export const processPayment = async (pack: LeadPack) => {
  // Logic to process payment for the selected lead pack
  console.log(`Processing payment for ${pack.name} pack...`);
  // Implement payment logic here
}; 