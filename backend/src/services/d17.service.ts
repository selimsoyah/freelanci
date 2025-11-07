import axios from 'axios';

/**
 * D17 Payment Gateway Integration for Tunisia
 * Docs: https://developers.d17.tn
 */

interface D17PaymentRequest {
  amount: number; // Amount in TND
  merchant_id: string;
  api_key: string;
  order_id: string; // Your internal transaction ID
  return_url: string;
  callback_url: string;
  customer_email?: string;
  customer_phone?: string;
}

interface D17PaymentResponse {
  success: boolean;
  payment_id: string;
  payment_url: string;
  message?: string;
}

interface D17CallbackData {
  payment_id: string;
  order_id: string;
  status: 'completed' | 'failed' | 'pending';
  amount: number;
  signature: string;
}

export class D17Service {
  private readonly baseURL: string;
  private readonly merchantId: string;
  private readonly apiKey: string;

  constructor() {
    this.baseURL = process.env.D17_API_URL || 'https://api.d17.tn/v1';
    this.merchantId = process.env.D17_MERCHANT_ID || '';
    this.apiKey = process.env.D17_API_KEY || '';

    if (!this.merchantId || !this.apiKey) {
      console.warn('⚠️  D17 credentials not configured. Payment processing will fail.');
    }
  }

  /**
   * Initiate a payment with D17
   * @param amount Amount in TND
   * @param transactionId Internal transaction ID
   * @param customerEmail Optional customer email
   * @returns Payment link and D17 payment ID
   */
  async initiatePayment(
    amount: number, 
    transactionId: string,
    customerEmail?: string
  ): Promise<{
    paymentId: string;
    paymentLink: string;
    success: boolean;
  }> {
    try {
      const backendURL = process.env.BACKEND_URL || 'http://localhost:5000';
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const payload: D17PaymentRequest = {
        amount: parseFloat(amount.toFixed(2)),
        merchant_id: this.merchantId,
        api_key: this.apiKey,
        order_id: transactionId,
        return_url: `${frontendURL}/payments/return?transaction_id=${transactionId}`,
        callback_url: `${backendURL}/api/v1/payments/webhook/d17`,
        customer_email: customerEmail,
      };

      console.log('🔄 Initiating D17 payment:', { amount, transactionId });

      const response = await axios.post<D17PaymentResponse>(
        `${this.baseURL}/payments/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        console.log('✅ D17 payment initiated:', response.data.payment_id);
        
        return {
          paymentId: response.data.payment_id,
          paymentLink: response.data.payment_url,
          success: true,
        };
      }

      throw new Error(response.data.message || 'Failed to initiate D17 payment');
    } catch (error: any) {
      console.error('❌ D17 payment initiation failed:', error.message);
      throw new Error(`D17 payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment status with D17
   * @param paymentId D17 payment ID
   * @returns Payment status and details
   */
  async verifyPayment(paymentId: string): Promise<{
    status: 'completed' | 'failed' | 'pending';
    amount: number;
    verified: boolean;
  }> {
    try {
      console.log('🔍 Verifying D17 payment:', paymentId);

      const response = await axios.get(
        `${this.baseURL}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        const status = response.data.status;
        const amount = response.data.amount;
        
        console.log('✅ D17 payment verified:', {
          id: paymentId,
          status,
          amount,
        });

        return {
          status,
          amount,
          verified: status === 'completed',
        };
      }

      throw new Error('Failed to verify D17 payment');
    } catch (error: any) {
      console.error('❌ D17 payment verification failed:', error.message);
      throw new Error(`D17 payment verification failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param callbackData Callback data from D17
   * @returns True if signature is valid
   */
  verifyWebhookSignature(callbackData: D17CallbackData): boolean {
    try {
      const crypto = require('crypto');
      const dataToSign = `${callbackData.payment_id}${callbackData.order_id}${callbackData.amount}${this.apiKey}`;
      const expectedSignature = crypto
        .createHash('sha256')
        .update(dataToSign)
        .digest('hex');

      return expectedSignature === callbackData.signature;
    } catch (error) {
      console.error('❌ D17 signature verification failed:', error);
      return false;
    }
  }

  /**
   * Check if D17 is configured
   */
  isConfigured(): boolean {
    return !!(this.merchantId && this.apiKey);
  }
}

export default new D17Service();
