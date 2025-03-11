import axios from 'axios';

interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
}

interface PaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  purchase_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class NOWPaymentsService {
  private apiKey: string;
  private baseURL = 'https://api.nowpayments.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createPayment(params: {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    order_id: string;
    order_description: string;
    ipn_callback_url?: string;
  }) {
    try {
      console.log('Creating NOWPayments payment with params:', params);
      console.log('Using API key:', this.apiKey ? 'Present' : 'Missing');

      if (!this.apiKey) {
        throw new Error('NOWPayments API key is not configured');
      }

      const response = await axios.post(
        `${this.baseURL}/payment`,
        params,
        { headers: this.headers }
      );

      console.log('NOWPayments API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating payment:', error.response?.data || error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/payment/${paymentId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/currencies`,
        { headers: this.headers }
      );

      return response.data.currencies;
    } catch (error: any) {
      console.error('NOWPayments get currencies error:', error.response?.data || error.message);
      throw new Error('Failed to get available currencies');
    }
  }

  async getMinimumPaymentAmount(currency: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/min-amount?currency=${currency}`,
        { headers: this.headers }
      );

      return response.data.min_amount;
    } catch (error: any) {
      console.error('NOWPayments get minimum amount error:', error.response?.data || error.message);
      throw new Error('Failed to get minimum payment amount');
    }
  }

  async estimatePrice(params: {
    amount: number;
    currency_from: string;
    currency_to: string;
  }): Promise<{
    estimated_amount: number;
    rate: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/estimate`,
        {
          params,
          headers: this.headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('NOWPayments estimate price error:', error.response?.data || error.message);
      throw new Error('Failed to estimate price');
    }
  }

  verifyIPNSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const secret = process.env.NOWPAYMENTS_IPN_SECRET;
      
      if (!secret) {
        throw new Error('NOWPayments IPN secret is not configured');
      }

      const hmac = crypto.createHmac('sha512', secret);
      hmac.update(payload);
      const calculatedSignature = hmac.digest('hex');

      return calculatedSignature === signature;
    } catch (error) {
      console.error('NOWPayments signature verification error:', error);
      return false;
    }
  }
}

export const nowPaymentsService = new NOWPaymentsService();
export type { CreatePaymentResponse, PaymentStatus };

export function verifyIPNSignature(payload: string, signature: string): boolean {
  try {
    const crypto = require('crypto');
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    
    if (!secret) {
      throw new Error('NOWPayments IPN secret is not configured');
    }

    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    return calculatedSignature === signature;
  } catch (error) {
    console.error('NOWPayments signature verification error:', error);
    return false;
  }
} 