import axios from 'axios';

/**
 * Flouci Payment Gateway Integration for Tunisia
 * Docs: https://dev.flouci.com
 */

interface FlouciPaymentRequest {
  amount: number; // Amount in TND (millimes will be calculated)
  app_token: string;
  app_secret: string;
  accept_card: boolean;
  session_timeout_secs?: number;
  success_link: string;
  fail_link: string;
  developer_tracking_id: string; // Your internal transaction ID
}

interface FlouciPaymentResponse {
  result: {
    _id: string; // Flouci payment ID
    link: string; // Payment page URL
    status: string;
  };
  success: boolean;
}

interface FlouciVerifyResponse {
  result: {
    _id: string;
    status: string; // 'SUCCESS' | 'PENDING' | 'FAILED'
    amount: number;
    amount_spent: number;
    updated_at: string;
  };
  success: boolean;
}

export class FlouciService {
  private readonly baseURL: string;
  private readonly appToken: string;
  private readonly appSecret: string;

  constructor() {
    this.baseURL = process.env.FLOUCI_API_URL || 'https://developers.flouci.com/api';
    this.appToken = process.env.FLOUCI_APP_TOKEN || '';
    this.appSecret = process.env.FLOUCI_APP_SECRET || '';

    if (!this.appToken || !this.appSecret) {
      console.warn('⚠️  Flouci credentials not configured. Payment processing will fail.');
    }
  }

  /**
   * Initiate a payment with Flouci
   * @param amount Amount in TND
   * @param transactionId Internal transaction ID
   * @returns Payment link and Flouci payment ID
   */
  async initiatePayment(amount: number, transactionId: string): Promise<{
    paymentId: string;
    paymentLink: string;
    success: boolean;
  }> {
    try {
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      const payload: FlouciPaymentRequest = {
        amount: Math.round(amount * 1000), // Convert TND to millimes
        app_token: this.appToken,
        app_secret: this.appSecret,
        accept_card: true,
        session_timeout_secs: 1200, // 20 minutes
        success_link: `${frontendURL}/payments/success?transaction_id=${transactionId}`,
        fail_link: `${frontendURL}/payments/failure?transaction_id=${transactionId}`,
        developer_tracking_id: transactionId,
      };

      console.log('🔄 Initiating Flouci payment:', { amount, transactionId });

      const response = await axios.post<FlouciPaymentResponse>(
        `${this.baseURL}/generate_payment`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.result) {
        console.log('✅ Flouci payment initiated:', response.data.result._id);
        
        return {
          paymentId: response.data.result._id,
          paymentLink: response.data.result.link,
          success: true,
        };
      }

      throw new Error('Failed to initiate Flouci payment');
    } catch (error: any) {
      console.error('❌ Flouci payment initiation failed:', error.message);
      throw new Error(`Flouci payment initiation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment status with Flouci
   * @param paymentId Flouci payment ID
   * @returns Payment status and details
   */
  async verifyPayment(paymentId: string): Promise<{
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    amount: number;
    amountSpent: number;
    verified: boolean;
  }> {
    try {
      console.log('🔍 Verifying Flouci payment:', paymentId);

      const response = await axios.get<FlouciVerifyResponse>(
        `${this.baseURL}/verify_payment/${paymentId}`,
        {
          params: {
            app_token: this.appToken,
            app_secret: this.appSecret,
          },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.result) {
        const result = response.data.result;
        
        console.log('✅ Flouci payment verified:', {
          id: paymentId,
          status: result.status,
          amount: result.amount / 1000, // Convert millimes to TND
        });

        return {
          status: result.status as 'SUCCESS' | 'PENDING' | 'FAILED',
          amount: result.amount / 1000, // Convert millimes to TND
          amountSpent: result.amount_spent / 1000,
          verified: result.status === 'SUCCESS',
        };
      }

      throw new Error('Failed to verify Flouci payment');
    } catch (error: any) {
      console.error('❌ Flouci payment verification failed:', error.message);
      throw new Error(`Flouci payment verification failed: ${error.message}`);
    }
  }

  /**
   * Check if Flouci is configured
   */
  isConfigured(): boolean {
    return !!(this.appToken && this.appSecret);
  }
}

export default new FlouciService();
