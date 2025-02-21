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

class NOWPaymentsService {
  private readonly API_URL = 'https://api.nowpayments.io/v1';
  private readonly API_KEY: string;

  constructor() {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('NOWPayments API key is not configured');
    }
    this.API_KEY = apiKey;
  }

  private get headers() {
    return {
      'x-api-key': this.API_KEY,
      'Content-Type': 'application/json',
    };
  }

  async createPayment(params: {
    price_amount: number;
    price_currency: string;
    pay_currency: string;
    order_id?: string;
    order_description?: string;
    ipn_callback_url?: string;
  }): Promise<CreatePaymentResponse> {
    try {
      const response = await axios.post(
        `${this.API_URL}/payment`,
        {
          ...params,
          ipn_callback_url: params.ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/crypto-payment`,
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('NOWPayments create payment error:', error.response?.data || error.message);
      throw new Error('Failed to create crypto payment');
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await axios.get(
        `${this.API_URL}/payment/${paymentId}`,
        { headers: this.headers }
      );

      return response.data;
    } catch (error: any) {
      console.error('NOWPayments get status error:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.API_URL}/currencies`,
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
        `${this.API_URL}/min-amount?currency=${currency}`,
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
        `${this.API_URL}/estimate`,
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