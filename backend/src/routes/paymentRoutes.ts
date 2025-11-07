import express from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import {
  initiateEscrowPayment,
  verifyPayment,
  releasePayment,
  requestRefund,
  resolveDispute,
  getTransactionHistory,
  getTransactionById,
} from '../controllers/paymentController';

const router = express.Router();

/**
 * @route   POST /api/v1/payments/initiate
 * @desc    Initiate escrow payment for accepted proposal
 * @access  Private (Client)
 */
router.post(
  '/initiate',
  authenticate,
  authorize(UserRole.CLIENT),
  [
    body('project_id')
      .isUUID()
      .withMessage('Valid project ID is required'),
    body('proposal_id')
      .isUUID()
      .withMessage('Valid proposal ID is required'),
    body('payment_method')
      .isIn(['flouci', 'd17', 'bank_transfer', 'edinar'])
      .withMessage('Valid payment method is required (flouci, d17, bank_transfer, edinar)'),
  ],
  initiateEscrowPayment
);

/**
 * @route   POST /api/v1/payments/verify/:transactionId
 * @desc    Verify payment with gateway and update escrow status
 * @access  Private (Client/Admin)
 */
router.post(
  '/verify/:transactionId',
  authenticate,
  [
    param('transactionId')
      .isUUID()
      .withMessage('Valid transaction ID is required'),
  ],
  verifyPayment
);

/**
 * @route   POST /api/v1/payments/release/:transactionId
 * @desc    Release payment to freelancer (project completed)
 * @access  Private (Client/Admin)
 */
router.post(
  '/release/:transactionId',
  authenticate,
  authorize(UserRole.CLIENT, UserRole.ADMIN),
  [
    param('transactionId')
      .isUUID()
      .withMessage('Valid transaction ID is required'),
  ],
  releasePayment
);

/**
 * @route   POST /api/v1/payments/refund/:transactionId
 * @desc    Request refund (open dispute)
 * @access  Private (Client)
 */
router.post(
  '/refund/:transactionId',
  authenticate,
  authorize(UserRole.CLIENT),
  [
    param('transactionId')
      .isUUID()
      .withMessage('Valid transaction ID is required'),
    body('reason')
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Refund reason must be between 20 and 1000 characters'),
  ],
  requestRefund
);

/**
 * @route   POST /api/v1/payments/resolve-dispute/:transactionId
 * @desc    Resolve dispute (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/resolve-dispute/:transactionId',
  authenticate,
  authorize(UserRole.ADMIN),
  [
    param('transactionId')
      .isUUID()
      .withMessage('Valid transaction ID is required'),
    body('resolution')
      .isIn(['release', 'refund'])
      .withMessage('Resolution must be either "release" or "refund"'),
    body('notes')
      .trim()
      .isLength({ min: 20, max: 1000 })
      .withMessage('Resolution notes must be between 20 and 1000 characters'),
  ],
  resolveDispute
);

/**
 * @route   GET /api/v1/payments/transactions
 * @desc    Get transaction history for logged-in user
 * @access  Private
 */
router.get(
  '/transactions',
  authenticate,
  getTransactionHistory
);

/**
 * @route   GET /api/v1/payments/transactions/:id
 * @desc    Get single transaction details
 * @access  Private (Transaction participant or Admin)
 */
router.get(
  '/transactions/:id',
  authenticate,
  [
    param('id')
      .isUUID()
      .withMessage('Valid transaction ID is required'),
  ],
  getTransactionById
);

/**
 * @route   POST /api/v1/payments/webhook/flouci
 * @desc    Flouci payment webhook
 * @access  Public (but verified by signature)
 */
router.post('/webhook/flouci', async (req, res) => {
  try {
    // Flouci webhook handler
    const { payment_id, developer_tracking_id, status } = req.body;

    console.log('📥 Flouci webhook received:', { payment_id, developer_tracking_id, status });

    // Find transaction by ID
    const { Transaction, EscrowPayment } = require('../models');
    const transaction = await Transaction.findByPk(developer_tracking_id);

    if (!transaction) {
      console.error('❌ Transaction not found:', developer_tracking_id);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (status === 'SUCCESS' && transaction.status === 'pending') {
      // Update transaction
      await transaction.update({
        status: 'escrowed',
        escrowed_at: new Date(),
        payment_gateway_response: req.body,
      });

      // Update escrow
      const escrow = await EscrowPayment.findOne({ where: { transaction_id: transaction.id } });
      if (escrow) {
        await escrow.update({
          status: 'held',
          hold_started_at: new Date(),
        });
      }

      console.log('✅ Payment confirmed and escrowed:', developer_tracking_id);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Flouci webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

/**
 * @route   POST /api/v1/payments/webhook/d17
 * @desc    D17 payment webhook
 * @access  Public (but verified by signature)
 */
router.post('/webhook/d17', async (req, res) => {
  try {
    const { payment_id, order_id, status, amount, signature } = req.body;

    console.log('📥 D17 webhook received:', { payment_id, order_id, status });

    // Verify signature
    const d17Service = require('../services/d17.service').default;
    const isValid = d17Service.verifyWebhookSignature(req.body);

    if (!isValid) {
      console.error('❌ Invalid D17 webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    // Find transaction
    const { Transaction, EscrowPayment } = require('../models');
    const transaction = await Transaction.findByPk(order_id);

    if (!transaction) {
      console.error('❌ Transaction not found:', order_id);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (status === 'completed' && transaction.status === 'pending') {
      // Update transaction
      await transaction.update({
        status: 'escrowed',
        escrowed_at: new Date(),
        payment_gateway_response: req.body,
      });

      // Update escrow
      const escrow = await EscrowPayment.findOne({ where: { transaction_id: transaction.id } });
      if (escrow) {
        await escrow.update({
          status: 'held',
          hold_started_at: new Date(),
        });
      }

      console.log('✅ D17 payment confirmed and escrowed:', order_id);
    } else if (status === 'failed') {
      await transaction.update({
        status: 'failed',
        payment_gateway_response: req.body,
      });
      console.log('❌ D17 payment failed:', order_id);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ D17 webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

export default router;
