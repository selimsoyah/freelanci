import sequelize from '../config/database';
import { Transaction, EscrowPayment } from '../models';
import { TransactionStatus } from '../models/Transaction';
import { EscrowStatus } from '../models/EscrowPayment';

/**
 * Mock payment verification for testing
 * Simulates a successful payment gateway callback
 */
async function mockVerifyPayment(transactionId: string) {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find the transaction
    const transaction = await Transaction.findByPk(transactionId, {
      include: [{ model: EscrowPayment, as: 'escrow' }]
    });

    if (!transaction) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('📋 Current Transaction Status:');
    console.log(`   ID: ${transaction.id}`);
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Amount: ${transaction.amount} TND`);
    console.log(`   Payment Method: ${transaction.payment_method}\n`);

    if (transaction.status !== TransactionStatus.PENDING) {
      console.log(`⚠️  Transaction is not in PENDING status (current: ${transaction.status})`);
      return;
    }

    // Mock payment gateway response
    const mockGatewayReference = `mock_${transaction.payment_method}_${Date.now()}`;
    const mockGatewayResponse = {
      payment_id: mockGatewayReference,
      status: 'success',
      amount: (parseFloat(transaction.amount.toString()) + parseFloat(transaction.client_fee.toString())).toString(),
      timestamp: new Date().toISOString(),
      test_mode: true
    };

    // Update transaction to escrowed
    await transaction.update({
      status: TransactionStatus.ESCROWED,
      payment_gateway_reference: mockGatewayReference,
      payment_gateway_response: mockGatewayResponse,
      escrowed_at: new Date()
    });

    // Update escrow status
    const escrow = transaction.escrow;
    if (escrow) {
      await escrow.update({
        status: EscrowStatus.HELD,
        hold_started_at: new Date()
      });
    }

    console.log('✅ Payment verified successfully (MOCK)');
    console.log('\n📊 Updated Status:');
    console.log(`   Transaction Status: ${TransactionStatus.ESCROWED}`);
    console.log(`   Escrow Status: ${EscrowStatus.HELD}`);
    console.log(`   Gateway Reference: ${mockGatewayReference}`);
    console.log(`   Escrowed At: ${new Date().toISOString()}`);
    console.log('\n💰 Funds Summary:');
    console.log(`   Amount Held in Escrow: ${escrow?.amount_held} TND`);
    console.log(`   Project Amount: ${transaction.amount} TND`);
    console.log(`   Platform Fee: ${transaction.client_fee} TND`);
    console.log(`   Freelancer Will Receive: ${transaction.net_amount} TND (after ${transaction.freelancer_fee} TND fee)`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Get transaction ID from command line
const transactionId = process.argv[2];

if (!transactionId) {
  console.log('❌ Please provide a transaction ID');
  console.log('Usage: npx ts-node src/scripts/mockPaymentVerification.ts <transaction_id>');
  process.exit(1);
}

mockVerifyPayment(transactionId);
