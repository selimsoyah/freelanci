# Payment System Testing Guide

## Overview
This document provides comprehensive testing procedures for the FreeTun payment and escrow system. The payment system handles real money transactions through Tunisian payment gateways (Flouci and D17) with an escrow mechanism to ensure fair transactions between clients and freelancers.

## ⚠️ Critical Testing Notes
- **Financial System**: This is a money-handling system - thorough testing is mandatory
- **Commission Structure**: 5% from client, 2% from freelancer (7% total platform revenue)
- **Escrow Protection**: Funds held until project completion or dispute resolution
- **Payment Gateways**: Flouci and D17 integration with webhook callbacks
- **Security**: Role-based access control, transaction authorization, webhook signature verification

## Prerequisites

### 1. Server Setup
```bash
cd backend
npm run dev
```
Server should be running on: `http://localhost:5000`

### 2. Test Users
You need to create test users with different roles:

**Client User:**
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "username": "test_client",
  "email": "client@test.com",
  "password": "Test123!@#",
  "role": "client"
}
```

**Freelancer User:**
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "username": "test_freelancer",
  "email": "freelancer@test.com",
  "password": "Test123!@#",
  "role": "freelancer"
}
```

**Admin User:**
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "username": "test_admin",
  "email": "admin@test.com",
  "password": "Test123!@#",
  "role": "admin"
}
```

### 3. Get Authentication Tokens
```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "client@test.com",
  "password": "Test123!@#"
}
```

Save the tokens:
- `CLIENT_TOKEN` - for client requests
- `FREELANCER_TOKEN` - for freelancer requests
- `ADMIN_TOKEN` - for admin requests

### 4. Setup Test Project and Proposal
Create a project, submit a proposal, and accept it before testing payments.

---

## Test Suite

### Test 1: Fee Calculation Validation

**Objective**: Verify that commission calculations are accurate

**Test Cases**:

| Project Amount | Client Fee (5%) | Freelancer Fee (2%) | Net to Freelancer | Total to Escrow |
|---------------|-----------------|---------------------|-------------------|-----------------|
| 100.00 TND    | 5.00 TND        | 2.00 TND            | 98.00 TND         | 105.00 TND      |
| 500.00 TND    | 25.00 TND       | 10.00 TND           | 490.00 TND        | 525.00 TND      |
| 1000.00 TND   | 50.00 TND       | 20.00 TND           | 980.00 TND        | 1050.00 TND     |
| 150.50 TND    | 7.53 TND        | 3.01 TND            | 147.49 TND        | 158.03 TND      |

**Manual Verification**:
```javascript
// Check backend calculation
const amount = 100.00;
const clientFee = amount * 0.05; // 5.00
const freelancerFee = amount * 0.02; // 2.00
const netAmount = amount - freelancerFee; // 98.00
const totalToEscrow = amount + clientFee; // 105.00
```

---

### Test 2: Complete Payment Flow (Success Path)

**Scenario**: Client pays for project, freelancer completes work, client releases payment

#### Step 2.1: Initiate Escrow Payment
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "flouci"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "transaction_id": 1,
    "amount": 100.00,
    "client_fee": 5.00,
    "total_to_pay": 105.00,
    "payment_method": "flouci",
    "status": "pending",
    "payment_link": "https://developers.flouci.com/pay/...",
    "payment_id": "flouci_payment_id_123"
  }
}
```

**Validations**:
- ✅ Transaction created with status "pending"
- ✅ EscrowPayment created with status "pending_payment"
- ✅ Fee calculations are correct
- ✅ Payment gateway link is returned
- ✅ Client is the authenticated user

#### Step 2.2: Verify Payment (Simulate Gateway Callback)
```bash
POST http://localhost:5000/api/v1/payments/verify/1
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment verified and funds are now held in escrow",
  "data": {
    "transaction_id": 1,
    "status": "escrowed",
    "amount": 100.00,
    "escrowed_at": "2024-01-15T10:30:00.000Z",
    "escrow": {
      "id": 1,
      "status": "held",
      "amount_held": 105.00,
      "hold_started_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Validations**:
- ✅ Transaction status updated to "escrowed"
- ✅ EscrowPayment status updated to "held"
- ✅ `escrowed_at` timestamp set
- ✅ `hold_started_at` timestamp set
- ✅ Payment gateway reference stored

#### Step 2.3: Release Payment to Freelancer
```bash
POST http://localhost:5000/api/v1/payments/release/1
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment released successfully to freelancer",
  "data": {
    "transaction_id": 1,
    "status": "released",
    "net_amount": 98.00,
    "freelancer_fee": 2.00,
    "released_at": "2024-01-15T11:00:00.000Z",
    "project_status": "completed"
  }
}
```

**Validations**:
- ✅ Transaction status updated to "released"
- ✅ EscrowPayment status updated to "released"
- ✅ `released_at` timestamp set
- ✅ Project status updated to "completed"
- ✅ Net amount calculation correct (amount - freelancer_fee)

---

### Test 3: Refund and Dispute Flow

**Scenario**: Client is unsatisfied and requests a refund, admin resolves the dispute

#### Step 3.1: Request Refund
```bash
POST http://localhost:5000/api/v1/payments/refund/2
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "reason": "Freelancer did not deliver the work as agreed. The quality was below expectations and several features were missing from the deliverable."
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Refund request submitted. Admin will review the dispute.",
  "data": {
    "transaction_id": 2,
    "escrow_status": "disputed",
    "dispute_reason": "Freelancer did not deliver the work as agreed...",
    "dispute_opened_at": "2024-01-15T12:00:00.000Z"
  }
}
```

**Validations**:
- ✅ EscrowPayment status updated to "disputed"
- ✅ Dispute reason stored (minimum 20 characters)
- ✅ `dispute_opened_at` timestamp set
- ✅ Only client can request refund
- ✅ Transaction must be in "escrowed" status

#### Step 3.2: Admin Resolves Dispute (Refund)
```bash
POST http://localhost:5000/api/v1/payments/resolve-dispute/2
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "resolution": "refund",
  "notes": "After reviewing the evidence, the client's complaint is valid. The freelancer failed to deliver key features. Refunding the client."
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Dispute resolved. Payment refunded to client.",
  "data": {
    "transaction_id": 2,
    "resolution": "refund",
    "transaction_status": "refunded",
    "escrow_status": "refunded",
    "refunded_at": "2024-01-15T13:00:00.000Z",
    "resolution_notes": "After reviewing the evidence..."
  }
}
```

**Validations**:
- ✅ Transaction status updated to "refunded"
- ✅ EscrowPayment status updated to "refunded"
- ✅ `refunded_at` timestamp set
- ✅ `dispute_resolved_at` timestamp set
- ✅ Resolution notes stored
- ✅ Only admin can resolve disputes

#### Step 3.3: Admin Resolves Dispute (Release)
```bash
POST http://localhost:5000/api/v1/payments/resolve-dispute/3
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "resolution": "release",
  "notes": "Freelancer delivered all agreed features. Client's complaint is invalid. Releasing payment to freelancer."
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Dispute resolved. Payment released to freelancer.",
  "data": {
    "transaction_id": 3,
    "resolution": "release",
    "transaction_status": "released",
    "escrow_status": "released",
    "released_at": "2024-01-15T13:30:00.000Z",
    "project_status": "completed"
  }
}
```

---

### Test 4: Transaction History

#### Step 4.1: Get All Transactions (Client)
```bash
GET http://localhost:5000/api/v1/payments/transactions
Authorization: Bearer {{CLIENT_TOKEN}}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "amount": 100.00,
      "client_fee": 5.00,
      "freelancer_fee": 2.00,
      "net_amount": 98.00,
      "payment_method": "flouci",
      "status": "released",
      "created_at": "2024-01-15T10:00:00.000Z",
      "project": {
        "id": 1,
        "title": "Website Development"
      }
    }
  ]
}
```

#### Step 4.2: Filter by Status
```bash
GET http://localhost:5000/api/v1/payments/transactions?status=escrowed
Authorization: Bearer {{CLIENT_TOKEN}}
```

#### Step 4.3: Filter by Payment Method
```bash
GET http://localhost:5000/api/v1/payments/transactions?payment_method=d17
Authorization: Bearer {{CLIENT_TOKEN}}
```

#### Step 4.4: Get Single Transaction
```bash
GET http://localhost:5000/api/v1/payments/transactions/1
Authorization: Bearer {{CLIENT_TOKEN}}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": 100.00,
    "client_fee": 5.00,
    "freelancer_fee": 2.00,
    "net_amount": 98.00,
    "payment_method": "flouci",
    "status": "released",
    "payment_gateway_reference": "flouci_payment_id_123",
    "payment_gateway_response": {...},
    "escrowed_at": "2024-01-15T10:30:00.000Z",
    "released_at": "2024-01-15T11:00:00.000Z",
    "project": {...},
    "proposal": {...},
    "client": {...},
    "freelancer": {...},
    "escrow": {...}
  }
}
```

---

### Test 5: Payment Methods Testing

#### Test 5.1: Flouci Payment
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "flouci"
}
```

**Validations**:
- ✅ Amount converted to millimes (multiply by 1000)
- ✅ Payment link generated
- ✅ 20-minute session timeout
- ✅ Callback URL includes transaction ID

#### Test 5.2: D17 Payment
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "d17"
}
```

**Validations**:
- ✅ Merchant ID and API key used
- ✅ Success and failure callback URLs provided
- ✅ Client email included in request
- ✅ Webhook signature verification configured

#### Test 5.3: Bank Transfer
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "bank_transfer"
}
```

**Expected**: Manual payment instructions returned

#### Test 5.4: eDinar
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "edinar"
}
```

---

### Test 6: Webhook Testing

#### Test 6.1: Flouci Webhook
```bash
POST http://localhost:5000/api/v1/payments/webhook/flouci
Content-Type: application/json

{
  "payment_id": "flouci_payment_id_123",
  "status": "success",
  "amount": 105000,
  "transaction_reference": "1"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

#### Test 6.2: D17 Webhook
```bash
POST http://localhost:5000/api/v1/payments/webhook/d17
Content-Type: application/json

{
  "payment_id": "d17_payment_id_456",
  "status": "completed",
  "amount": 105.00,
  "transaction_reference": "2",
  "signature": "generated_signature_hash"
}
```

**Validations**:
- ✅ Signature verification passes
- ✅ Transaction status updated
- ✅ Escrow status updated

---

### Test 7: Error Handling

#### Test 7.1: Invalid Payment Method
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "invalid_method"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid payment method"
}
```

#### Test 7.2: Unauthorized Release Attempt
```bash
POST http://localhost:5000/api/v1/payments/release/1
Authorization: Bearer {{FREELANCER_TOKEN}}
```

**Expected Response** (403 Forbidden):
```json
{
  "success": false,
  "message": "Not authorized"
}
```

#### Test 7.3: Duplicate Payment for Same Project
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "flouci"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Payment already exists for this project"
}
```

#### Test 7.4: Refund Reason Too Short
```bash
POST http://localhost:5000/api/v1/payments/refund/1
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "reason": "Bad work"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Refund reason must be at least 20 characters"
}
```

#### Test 7.5: Release Already Released Payment
```bash
POST http://localhost:5000/api/v1/payments/release/1
Authorization: Bearer {{CLIENT_TOKEN}}
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "message": "Payment has already been released"
}
```

#### Test 7.6: Payment Gateway Not Configured
Mock environment variables missing and try to initiate payment:

**Expected Response** (500 Internal Server Error):
```json
{
  "success": false,
  "message": "Flouci payment gateway is not properly configured"
}
```

---

### Test 8: Authorization Testing

#### Test 8.1: Freelancer Cannot Initiate Payment
```bash
POST http://localhost:5000/api/v1/payments/initiate
Authorization: Bearer {{FREELANCER_TOKEN}}
Content-Type: application/json

{
  "project_id": 1,
  "proposal_id": 1,
  "payment_method": "flouci"
}
```

**Expected Response** (403 Forbidden)

#### Test 8.2: Non-participant Cannot View Transaction
```bash
GET http://localhost:5000/api/v1/payments/transactions/1
Authorization: Bearer {{OTHER_USER_TOKEN}}
```

**Expected Response** (403 Forbidden)

#### Test 8.3: Non-admin Cannot Resolve Dispute
```bash
POST http://localhost:5000/api/v1/payments/resolve-dispute/1
Authorization: Bearer {{CLIENT_TOKEN}}
Content-Type: application/json

{
  "resolution": "refund",
  "notes": "Test"
}
```

**Expected Response** (403 Forbidden)

---

### Test 9: Escrow State Machine

Test all valid and invalid state transitions:

| Current Status | Action | Valid? | New Status |
|---------------|--------|--------|------------|
| pending_payment | verify | ✅ Yes | held |
| held | release | ✅ Yes | released |
| held | refund | ✅ Yes | disputed → refunded |
| disputed | resolve(release) | ✅ Yes | released |
| disputed | resolve(refund) | ✅ Yes | refunded |
| released | release | ❌ No | Error |
| refunded | release | ❌ No | Error |
| pending_payment | release | ❌ No | Error |

---

### Test 10: Data Integrity

#### Test 10.1: Fee Calculation Consistency
For every transaction, verify:
```sql
SELECT 
  amount,
  client_fee,
  freelancer_fee,
  net_amount,
  (amount * 0.05) as expected_client_fee,
  (amount * 0.02) as expected_freelancer_fee,
  (amount - (amount * 0.02)) as expected_net_amount
FROM transactions;
```

#### Test 10.2: Escrow Amount Matches
```sql
SELECT 
  t.id,
  t.amount + t.client_fee as total_paid,
  e.amount_held,
  (t.amount + t.client_fee = e.amount_held) as amounts_match
FROM transactions t
JOIN escrow_payments e ON e.transaction_id = t.id;
```

#### Test 10.3: Timestamp Consistency
Verify timestamps are in correct order:
- `created_at` < `escrowed_at` < `released_at`
- For disputes: `dispute_opened_at` < `dispute_resolved_at`

---

## Mock Testing (Without Real Payment Gateways)

Since Flouci and D17 require real accounts and API keys, you can mock their responses for testing:

### Mock Flouci Service
```javascript
// backend/src/services/flouci.service.ts
initiatePayment: async (amount: number, transactionId: number) => {
  // Mock response for testing
  return {
    success: true,
    paymentId: `mock_flouci_${transactionId}_${Date.now()}`,
    paymentLink: `https://mock.flouci.com/pay/${transactionId}`,
    sessionTimeout: 1200000
  };
},

verifyPayment: async (paymentId: string) => {
  // Mock verification
  return {
    success: true,
    status: 'success',
    amount: 105000, // in millimes
    verified: true
  };
}
```

### Mock D17 Service
```javascript
// backend/src/services/d17.service.ts
initiatePayment: async (amount: number, transactionId: number, email: string) => {
  return {
    success: true,
    paymentId: `mock_d17_${transactionId}_${Date.now()}`,
    paymentLink: `https://mock.d17.tn/checkout/${transactionId}`
  };
},

verifyPayment: async (paymentId: string) => {
  return {
    success: true,
    status: 'completed',
    amount: 105.00,
    verified: true
  };
}
```

---

## Performance Testing

### Test P1: Load Testing
Simulate 100 concurrent payment initiations:
```bash
# Using Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p payment.json -T application/json \
  http://localhost:5000/api/v1/payments/initiate
```

### Test P2: Database Query Optimization
Check query performance for transaction history:
```bash
# Enable query logging in PostgreSQL
# Check execution time for:
GET /api/v1/payments/transactions
```

Expected: < 100ms for 1000 transactions

---

## Security Testing

### Test S1: SQL Injection
Try malicious inputs:
```bash
GET /api/v1/payments/transactions/1'; DROP TABLE transactions; --
```

Expected: Proper sanitization, no SQL execution

### Test S2: JWT Token Tampering
Modify token and try to access:
```bash
Authorization: Bearer tampered.invalid.token
```

Expected: 401 Unauthorized

### Test S3: Rate Limiting
Make 100 requests in 1 second:
```bash
for i in {1..100}; do
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:5000/api/v1/payments/transactions
done
```

Expected: Rate limiting applied (if implemented)

---

## Test Coverage Checklist

- [ ] All payment methods tested (Flouci, D17, Bank Transfer, eDinar)
- [ ] Fee calculations verified for multiple amounts
- [ ] Complete success flow (initiate → verify → release)
- [ ] Complete refund flow (initiate → verify → refund request → admin resolve)
- [ ] All error cases handled
- [ ] Authorization checks for all roles
- [ ] Webhooks tested for both gateways
- [ ] Transaction history with filters
- [ ] Escrow state machine transitions
- [ ] Data integrity verified
- [ ] Timestamps consistency checked
- [ ] Duplicate payment prevention
- [ ] Performance under load
- [ ] Security vulnerabilities checked

---

## Known Limitations

1. **Real Gateway Testing**: Requires actual Flouci and D17 accounts with test API keys
2. **Webhook Testing**: Need to use tools like ngrok to expose localhost for webhook callbacks
3. **Bank Transfer**: Manual verification process not automated
4. **Refund Processing**: Currently marks as refunded but doesn't actually transfer money back

---

## Next Steps After Testing

1. ✅ If all tests pass → Move to Phase 7 (Messaging System)
2. ❌ If tests fail → Document issues, fix bugs, re-test
3. 🔄 Consider adding automated test suite with Jest/Mocha
4. 📊 Add monitoring and logging for production transactions
5. 🔒 Implement additional security measures (rate limiting, 2FA for large amounts)

---

## Support

For issues or questions:
- Check error logs in terminal
- Review backend/src/controllers/paymentController.ts
- Verify environment variables in backend/.env
- Check database transactions table for data integrity

**Last Updated**: Phase 6 Implementation - Payment Integration Complete
