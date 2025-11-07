import { Request, Response } from 'express';
import { Transaction, EscrowPayment, Project, Proposal, User, Profile } from '../models';
import { TransactionStatus, PaymentMethod } from '../models/Transaction';
import { EscrowStatus } from '../models/EscrowPayment';
import flouciService from '../services/flouci.service';
import d17Service from '../services/d17.service';

/**
 * Initiate escrow payment (after proposal is accepted)
 * POST /api/v1/payments/initiate
 */
export const initiateEscrowPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { project_id, proposal_id, payment_method } = req.body;
    const client_id = req.user?.userId;

    if (!client_id) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(payment_method)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method. Supported: flouci, d17, bank_transfer, edinar' 
      });
      return;
    }

    // Get project and proposal
    const project = await Project.findByPk(project_id);
    const proposal = await Proposal.findByPk(proposal_id);

    if (!project || !proposal) {
      res.status(404).json({ success: false, message: 'Project or proposal not found' });
      return;
    }

    // Verify project belongs to client
    if (project.client_id !== client_id) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to initiate payment for this project' 
      });
      return;
    }

    // Verify proposal is accepted
    if (proposal.status !== 'accepted') {
      res.status(400).json({ 
        success: false, 
        message: 'Can only initiate payment for accepted proposals' 
      });
      return;
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({
      where: { project_id, proposal_id },
    });

    if (existingTransaction) {
      res.status(400).json({ 
        success: false, 
        message: 'Payment already initiated for this project',
        data: existingTransaction,
      });
      return;
    }

    // Calculate fees
    const fees = Transaction.calculateFees(parseFloat(proposal.proposed_budget.toString()));

    // Create transaction
    const transaction = await Transaction.create({
      project_id,
      proposal_id,
      client_id,
      freelancer_id: proposal.freelancer_id,
      amount: fees.amount,
      client_fee: fees.clientFee,
      freelancer_fee: fees.freelancerFee,
      net_amount: fees.netAmount,
      payment_method,
      status: TransactionStatus.PENDING,
    });

    // Create escrow record
    const escrow = await EscrowPayment.create({
      transaction_id: transaction.id,
      project_id,
      amount_held: fees.totalToEscrow,
      status: EscrowStatus.PENDING_PAYMENT,
    });

    // Initiate payment with gateway
    let paymentLink: string | null = null;
    let gatewayPaymentId: string | null = null;

    try {
      if (payment_method === PaymentMethod.FLOUCI && flouciService.isConfigured()) {
        const result = await flouciService.initiatePayment(fees.totalToEscrow, transaction.id);
        paymentLink = result.paymentLink;
        gatewayPaymentId = result.paymentId;
        
        await transaction.update({ payment_gateway_reference: gatewayPaymentId });
      } else if (payment_method === PaymentMethod.D17 && d17Service.isConfigured()) {
        const client = await User.findByPk(client_id);
        const result = await d17Service.initiatePayment(
          fees.totalToEscrow, 
          transaction.id,
          client?.email
        );
        paymentLink = result.paymentLink;
        gatewayPaymentId = result.paymentId;
        
        await transaction.update({ payment_gateway_reference: gatewayPaymentId });
      }
    } catch (gatewayError: any) {
      console.error('Payment gateway error:', gatewayError);
      // Don't fail - allow manual payment methods
    }

    res.status(201).json({
      success: true,
      message: 'Escrow payment initiated successfully',
      data: {
        transaction,
        escrow,
        payment_link: paymentLink,
        gateway_payment_id: gatewayPaymentId,
        amount_to_pay: fees.totalToEscrow,
        breakdown: {
          project_amount: fees.amount,
          platform_fee: fees.clientFee,
          total: fees.totalToEscrow,
        },
      },
    });
  } catch (error: any) {
    console.error('Error initiating escrow payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Verify payment with gateway and update escrow status
 * POST /api/v1/payments/verify/:transactionId
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const user_id = req.user?.userId;

    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: EscrowPayment, as: 'escrow' },
        { model: Project, as: 'project' },
      ],
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    // Verify user is authorized (client or admin)
    if (transaction.client_id !== user_id && req.user?.role !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to verify this payment' 
      });
      return;
    }

    if (!transaction.payment_gateway_reference) {
      res.status(400).json({ 
        success: false, 
        message: 'No payment gateway reference found. Use manual confirmation for bank transfers.' 
      });
      return;
    }

    // Verify with payment gateway
    let verified = false;
    let gatewayStatus = '';

    if (transaction.payment_method === PaymentMethod.FLOUCI) {
      const result = await flouciService.verifyPayment(transaction.payment_gateway_reference);
      verified = result.verified;
      gatewayStatus = result.status;
      
      await transaction.update({ 
        payment_gateway_response: result,
      });
    } else if (transaction.payment_method === PaymentMethod.D17) {
      const result = await d17Service.verifyPayment(transaction.payment_gateway_reference);
      verified = result.verified;
      gatewayStatus = result.status;
      
      await transaction.update({ 
        payment_gateway_response: result,
      });
    }

    if (verified) {
      // Update transaction and escrow status
      await transaction.update({
        status: TransactionStatus.ESCROWED,
        escrowed_at: new Date(),
      });

      const escrow = await EscrowPayment.findOne({ where: { transaction_id: transaction.id } });
      if (escrow) {
        await escrow.update({
          status: EscrowStatus.HELD,
          hold_started_at: new Date(),
        });
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and funds held in escrow',
        data: {
          transaction,
          escrow,
          gateway_status: gatewayStatus,
        },
      });
    } else {
      await transaction.update({
        status: TransactionStatus.FAILED,
      });

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        gateway_status: gatewayStatus,
      });
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Release payment to freelancer (when project is completed)
 * POST /api/v1/payments/release/:transactionId
 */
export const releasePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const user_id = req.user?.userId;

    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: EscrowPayment, as: 'escrow' },
        { model: Project, as: 'project' },
        { 
          model: User, 
          as: 'freelancer',
          include: [{ model: Profile, as: 'profile' }],
        },
      ],
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    // Verify user is authorized (client or admin)
    if (transaction.client_id !== user_id && req.user?.role !== 'admin') {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to release this payment' 
      });
      return;
    }

    // Check if payment is escrowed
    if (transaction.status !== TransactionStatus.ESCROWED) {
      res.status(400).json({ 
        success: false, 
        message: `Cannot release payment with status: ${transaction.status}` 
      });
      return;
    }

    const escrow = transaction.escrow as any;
    if (!escrow || escrow.status !== EscrowStatus.HELD) {
      res.status(400).json({ 
        success: false, 
        message: 'Escrow must be in HELD status to release funds' 
      });
      return;
    }

    // Update transaction status
    await transaction.update({
      status: TransactionStatus.RELEASED,
      released_at: new Date(),
    });

    // Update escrow status
    await escrow.update({
      status: EscrowStatus.RELEASED,
      hold_released_at: new Date(),
    });

    // Update project status
    const project = transaction.project as any;
    if (project) {
      await project.update({ status: 'completed' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment released to freelancer successfully',
      data: {
        transaction,
        escrow,
        net_amount_to_freelancer: transaction.net_amount,
        platform_commission: transaction.freelancer_fee,
      },
    });
  } catch (error: any) {
    console.error('Error releasing payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Request refund (open dispute)
 * POST /api/v1/payments/refund/:transactionId
 */
export const requestRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const user_id = req.user?.userId;

    if (!reason || reason.length < 20) {
      res.status(400).json({ 
        success: false, 
        message: 'Refund reason must be at least 20 characters' 
      });
      return;
    }

    const transaction = await Transaction.findByPk(transactionId, {
      include: [{ model: EscrowPayment, as: 'escrow' }],
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    // Only client can request refund
    if (transaction.client_id !== user_id) {
      res.status(403).json({ 
        success: false, 
        message: 'Only the client can request a refund' 
      });
      return;
    }

    // Check if payment is escrowed
    if (transaction.status !== TransactionStatus.ESCROWED) {
      res.status(400).json({ 
        success: false, 
        message: `Cannot request refund for payment with status: ${transaction.status}` 
      });
      return;
    }

    const escrow = transaction.escrow as any;
    if (!escrow) {
      res.status(404).json({ success: false, message: 'Escrow record not found' });
      return;
    }

    // Open dispute
    await escrow.openDispute(reason);

    res.status(200).json({
      success: true,
      message: 'Refund request submitted. Admin will review the dispute.',
      data: {
        transaction,
        escrow,
      },
    });
  } catch (error: any) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Resolve dispute (Admin only)
 * POST /api/v1/payments/resolve-dispute/:transactionId
 */
export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { resolution, notes } = req.body;

    if (!['release', 'refund'].includes(resolution)) {
      res.status(400).json({ 
        success: false, 
        message: 'Resolution must be either "release" or "refund"' 
      });
      return;
    }

    if (!notes || notes.length < 20) {
      res.status(400).json({ 
        success: false, 
        message: 'Resolution notes must be at least 20 characters' 
      });
      return;
    }

    const transaction = await Transaction.findByPk(transactionId, {
      include: [
        { model: EscrowPayment, as: 'escrow' },
        { model: Project, as: 'project' },
      ],
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const escrow = transaction.escrow as any;
    if (!escrow || escrow.status !== EscrowStatus.DISPUTED) {
      res.status(400).json({ 
        success: false, 
        message: 'Can only resolve disputed escrows' 
      });
      return;
    }

    // Resolve the dispute
    await escrow.resolveDispute(resolution, notes);

    // Update transaction
    const newStatus = resolution === 'release' ? TransactionStatus.RELEASED : TransactionStatus.REFUNDED;
    const updateData: any = {
      status: newStatus,
    };

    if (resolution === 'release') {
      updateData.released_at = new Date();
      // Update project to completed
      const project = transaction.project as any;
      if (project) {
        await project.update({ status: 'completed' });
      }
    } else {
      updateData.refunded_at = new Date();
      updateData.refund_reason = notes;
      // Update project to cancelled
      const project = transaction.project as any;
      if (project) {
        await project.update({ status: 'cancelled' });
      }
    }

    await transaction.update(updateData);

    res.status(200).json({
      success: true,
      message: `Dispute resolved: ${resolution}`,
      data: {
        transaction,
        escrow,
      },
    });
  } catch (error: any) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Get transaction history for a user
 * GET /api/v1/payments/transactions
 */
export const getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.userId;
    const { status, payment_method } = req.query;

    const whereClause: any = {};
    
    // User can see transactions where they are client or freelancer
    whereClause[require('sequelize').Op.or] = [
      { client_id: user_id },
      { freelancer_id: user_id },
    ];

    if (status && Object.values(TransactionStatus).includes(status as TransactionStatus)) {
      whereClause.status = status;
    }

    if (payment_method && Object.values(PaymentMethod).includes(payment_method as PaymentMethod)) {
      whereClause.payment_method = payment_method;
    }

    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'status'] },
        { model: Proposal, as: 'proposal', attributes: ['id', 'proposed_budget'] },
        { model: EscrowPayment, as: 'escrow' },
        { 
          model: User, 
          as: 'client',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile', attributes: ['full_name'] }],
        },
        { 
          model: User, 
          as: 'freelancer',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile', attributes: ['full_name'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

/**
 * Get single transaction details
 * GET /api/v1/payments/transactions/:id
 */
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = req.user?.userId;

    const transaction = await Transaction.findByPk(id, {
      include: [
        { model: Project, as: 'project' },
        { model: Proposal, as: 'proposal' },
        { model: EscrowPayment, as: 'escrow' },
        { 
          model: User, 
          as: 'client',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile' }],
        },
        { 
          model: User, 
          as: 'freelancer',
          attributes: ['id', 'email'],
          include: [{ model: Profile, as: 'profile' }],
        },
      ],
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    // Verify user is authorized
    if (
      transaction.client_id !== user_id &&
      transaction.freelancer_id !== user_id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view this transaction' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
