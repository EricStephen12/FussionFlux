import { db } from '@/utils/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import axios from 'axios';

interface CryptoPayment {
  userId: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  walletAddress?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

class CryptoPaymentService {
  private readonly API_URL = 'https://api.nowpayments.io/v1';
  private readonly API_KEY = process.env.NOWPAYMENTS_API_KEY;

  constructor() {
    if (!this.API_KEY) {
      throw new Error('NOWPayments API key is not configured');
    }
  }

  private get headers() {
    return {
      'x-api-key': this.API_KEY,
      'Content-Type': 'application/json',
    };
  }

  async createPayment(
    userId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<{
    paymentId: string;
    walletAddress: string;
    qrCode: string;
  }> {
    try {
      // Create payment in NOWPayments
      const response = await axios.post(
        `${this.API_URL}/payment`,
        {
          price_amount: amount,
          price_currency: currency,
          pay_currency: 'USDT', // Default to USDT, can be changed to BTC/ETH
          ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/crypto-payment`,
        },
        { headers: this.headers }
      );

      const { payment_id, pay_address, pay_currency } = response.data;

      // Store payment info in Firestore
      const payment: CryptoPayment = {
        userId,
        amount,
        currency,
        paymentId: payment_id,
        status: 'pending',
        walletAddress: pay_address,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'crypto_payments'), payment);

      // Generate QR code
      const qrCode = await this.generateQRCode(pay_address, amount, pay_currency);

      return {
        paymentId: payment_id,
        walletAddress: pay_address,
        qrCode,
      };
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      throw new Error('Failed to create crypto payment');
    }
  }

  private async generateQRCode(
    address: string,
    amount: number,
    currency: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.API_URL}/qr`,
        {
          address,
          amount,
          currency,
        },
        { headers: this.headers }
      );

      return response.data.qr_code;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.API_URL}/payment/${paymentId}`,
        { headers: this.headers }
      );

      const { payment_status, pay_address, transaction_id } = response.data;

      // Update payment status in Firestore
      const paymentsRef = collection(db, 'crypto_payments');
      const paymentQuery = query(
        paymentsRef,
        where('paymentId', '==', paymentId)
      );
      const paymentDocs = await getDocs(paymentQuery);

      if (!paymentDocs.empty) {
        const paymentDoc = paymentDocs.docs[0];
        await updateDoc(doc(paymentsRef, paymentDoc.id), {
          status: payment_status === 'finished' ? 'completed' : 'pending',
          txHash: transaction_id,
          updatedAt: new Date(),
        });
      }

      return payment_status === 'finished';
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async processIPNCallback(data: any): Promise<void> {
    try {
      const {
        payment_id,
        payment_status,
        pay_address,
        transaction_id,
      } = data;

      if (payment_status === 'finished') {
        const paymentsRef = collection(db, 'crypto_payments');
        const paymentQuery = query(
          paymentsRef,
          where('paymentId', '==', payment_id)
        );
        const paymentDocs = await getDocs(paymentQuery);

        if (!paymentDocs.empty) {
          const paymentDoc = paymentDocs.docs[0];
          const payment = paymentDoc.data() as CryptoPayment;

          // Update payment status
          await updateDoc(doc(paymentsRef, paymentDoc.id), {
            status: 'completed',
            txHash: transaction_id,
            updatedAt: new Date(),
          });

          // Grant access to user (e.g., add credits)
          await firestoreService.updateUserCredits(
            payment.userId,
            this.calculateCredits(payment.amount)
          );
        }
      }
    } catch (error) {
      console.error('Error processing IPN callback:', error);
      throw error;
    }
  }

  private calculateCredits(amount: number): number {
    // Convert payment amount to credits based on your pricing
    return Math.floor(amount * 100); // Example: $1 = 100 credits
  }
}

export const cryptoPaymentService = new CryptoPaymentService();
export type { CryptoPayment }; 