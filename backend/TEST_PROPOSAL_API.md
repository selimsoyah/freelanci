# Proposal API Testing Guide

This document provides comprehensive testing scenarios for the FreeTun Proposal System API endpoints.

## Prerequisites

1. Server running on `http://localhost:5000`
2. PostgreSQL database connected
3. At least one client and one freelancer account registered
4. At least one open project created by the client

## Authentication Tokens

You'll need to obtain JWT tokens for both a client and a freelancer:

```bash
# Register and login as CLIENT
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "Client123!",
    "role": "client",
    "full_name": "Test Client"
  }'

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "Client123!"
  }'

# Save the accessToken as CLIENT_TOKEN

# Register and login as FREELANCER
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@test.com",
    "password": "Freelancer123!",
    "role": "freelancer",
    "full_name": "Test Freelancer"
  }'

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@test.com",
    "password": "Freelancer123!"
  }'

# Save the accessToken as FREELANCER_TOKEN
```

## Setup: Create a Test Project

```bash
# Create a project as CLIENT (save the project ID)
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -d '{
    "title": "Build a React Landing Page",
    "description": "Need a professional landing page built with React and Tailwind CSS. Should be responsive and SEO optimized. Looking for someone with experience in modern web development.",
    "category_id": "CATEGORY_UUID_FROM_DATABASE",
    "budget_min": 500,
    "budget_max": 1000,
    "deadline": "2025-12-31",
    "skills_required": ["React", "Tailwind CSS", "Responsive Design", "SEO"]
  }'

# Save the project ID as PROJECT_ID
```

---

## API Endpoints Testing

### 1. Submit a Proposal (Freelancer)

**Endpoint:** `POST /api/v1/proposals`

**Test Case 1.1: Successful Proposal Submission**
```bash
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "cover_letter": "Hello! I am very interested in your project. I have over 5 years of experience in React development and have built numerous landing pages with Tailwind CSS. I can deliver a fully responsive, SEO-optimized landing page within your deadline. Looking forward to working with you!",
    "proposed_budget": 750,
    "delivery_time": 14,
    "attachments": ["https://example.com/portfolio1.png", "https://example.com/portfolio2.png"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal submitted successfully",
  "data": {
    "id": "proposal-uuid",
    "project_id": "project-uuid",
    "freelancer_id": "freelancer-uuid",
    "cover_letter": "...",
    "proposed_budget": 750,
    "delivery_time": 14,
    "status": "pending",
    "attachments": ["https://example.com/portfolio1.png"],
    "created_at": "2025-11-05T...",
    "freelancer": {
      "id": "freelancer-uuid",
      "email": "freelancer@test.com",
      "profile": {
        "full_name": "Test Freelancer",
        "bio": "...",
        "skills": ["React", "Tailwind"]
      }
    }
  }
}
```

**Test Case 1.2: Cover Letter Too Short**
```bash
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "cover_letter": "I can do it!",
    "proposed_budget": 750,
    "delivery_time": 14
  }'
```

**Expected Response:** `400 Bad Request` - "Cover letter must be between 100 and 2000 characters"

**Test Case 1.3: Duplicate Proposal**
```bash
# Try to submit another proposal on the same project
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "cover_letter": "Another attempt with a different cover letter that is long enough to pass validation. I really want to work on this project and have great experience in React development.",
    "proposed_budget": 800,
    "delivery_time": 10
  }'
```

**Expected Response:** `400 Bad Request` - "You have already submitted a proposal for this project"

**Test Case 1.4: Client Cannot Submit Proposal on Own Project**
```bash
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "cover_letter": "This is a long cover letter that meets the minimum character requirement for proposal submission. Testing if clients can submit proposals on their own projects.",
    "proposed_budget": 500,
    "delivery_time": 7
  }'
```

**Expected Response:** `403 Forbidden` - "Insufficient permissions" (client role not allowed)

---

### 2. Get My Proposals (Freelancer)

**Endpoint:** `GET /api/v1/proposals/my-proposals`

**Test Case 2.1: View All My Proposals**
```bash
curl -X GET http://localhost:5000/api/v1/proposals/my-proposals \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "proposal-uuid",
      "project_id": "project-uuid",
      "cover_letter": "...",
      "proposed_budget": 750,
      "delivery_time": 14,
      "status": "pending",
      "created_at": "2025-11-05T...",
      "project": {
        "id": "project-uuid",
        "title": "Build a React Landing Page",
        "description": "...",
        "budget_min": 500,
        "budget_max": 1000,
        "status": "open",
        "client": {
          "id": "client-uuid",
          "email": "client@test.com",
          "profile": {
            "full_name": "Test Client"
          }
        }
      }
    }
  ]
}
```

**Test Case 2.2: Filter by Status (Pending)**
```bash
curl -X GET "http://localhost:5000/api/v1/proposals/my-proposals?status=pending" \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

---

### 3. Get Proposals for a Project (Client/Project Owner)

**Endpoint:** `GET /api/v1/proposals/project/:projectId`

**Test Case 3.1: Client Views Proposals on Their Project**
```bash
curl -X GET http://localhost:5000/api/v1/proposals/project/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "proposal-uuid",
      "project_id": "project-uuid",
      "freelancer_id": "freelancer-uuid",
      "cover_letter": "...",
      "proposed_budget": 750,
      "delivery_time": 14,
      "status": "pending",
      "attachments": ["https://example.com/portfolio1.png"],
      "created_at": "2025-11-05T...",
      "freelancer": {
        "id": "freelancer-uuid",
        "email": "freelancer@test.com",
        "profile": {
          "full_name": "Test Freelancer",
          "bio": "...",
          "skills": ["React", "Tailwind"],
          "hourly_rate": 50,
          "portfolio_url": "https://..."
        }
      }
    }
  ]
}
```

**Test Case 3.2: Freelancer Cannot View Proposals on Another's Project**
```bash
curl -X GET http://localhost:5000/api/v1/proposals/project/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:** `403 Forbidden` - "You are not authorized to view proposals for this project"

---

### 4. Get Single Proposal by ID

**Endpoint:** `GET /api/v1/proposals/:id`

**Test Case 4.1: Freelancer Views Their Own Proposal**
```bash
curl -X GET http://localhost:5000/api/v1/proposals/YOUR_PROPOSAL_ID \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Test Case 4.2: Client Views Proposal on Their Project**
```bash
curl -X GET http://localhost:5000/api/v1/proposals/YOUR_PROPOSAL_ID \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:** Full proposal details with freelancer profile and project info

---

### 5. Accept a Proposal (Client)

**Endpoint:** `PUT /api/v1/proposals/:id/accept`

**Test Case 5.1: Client Accepts a Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/YOUR_PROPOSAL_ID/accept \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal accepted successfully. Project status updated to in_progress.",
  "data": {
    "id": "proposal-uuid",
    "status": "accepted",
    "project": {
      "id": "project-uuid",
      "title": "Build a React Landing Page",
      "status": "in_progress"
    },
    "freelancer": {
      "id": "freelancer-uuid",
      "email": "freelancer@test.com",
      "profile": {
        "full_name": "Test Freelancer"
      }
    }
  }
}
```

**Side Effects:**
- Proposal status → `accepted`
- Project status → `in_progress`
- All other pending proposals on same project → automatically `rejected`

**Test Case 5.2: Cannot Accept Already Accepted Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/YOUR_PROPOSAL_ID/accept \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:** `400 Bad Request` - "Cannot accept an accepted proposal"

**Test Case 5.3: Freelancer Cannot Accept Proposals**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/ANOTHER_PROPOSAL_ID/accept \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:** `403 Forbidden` - "Insufficient permissions"

---

### 6. Reject a Proposal (Client)

**Endpoint:** `PUT /api/v1/proposals/:id/reject`

**Setup:** Create a second freelancer and have them submit a proposal

**Test Case 6.1: Client Rejects a Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/SECOND_PROPOSAL_ID/reject \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal rejected successfully",
  "data": {
    "id": "proposal-uuid",
    "status": "rejected",
    "freelancer": {
      "id": "freelancer-uuid",
      "profile": {
        "full_name": "Second Freelancer"
      }
    }
  }
}
```

**Test Case 6.2: Cannot Reject Already Rejected Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/SECOND_PROPOSAL_ID/reject \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"
```

**Expected Response:** `400 Bad Request` - "Cannot reject a rejected proposal"

---

### 7. Withdraw a Proposal (Freelancer)

**Endpoint:** `PUT /api/v1/proposals/:id/withdraw`

**Setup:** Create a new project and submit a proposal that hasn't been accepted/rejected yet

**Test Case 7.1: Freelancer Withdraws Their Pending Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/PENDING_PROPOSAL_ID/withdraw \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Proposal withdrawn successfully",
  "data": {
    "id": "proposal-uuid",
    "status": "withdrawn"
  }
}
```

**Test Case 7.2: Cannot Withdraw Accepted Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/ACCEPTED_PROPOSAL_ID/withdraw \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:** `400 Bad Request` - "Cannot withdraw an accepted proposal"

**Test Case 7.3: Cannot Withdraw Another Freelancer's Proposal**
```bash
curl -X PUT http://localhost:5000/api/v1/proposals/OTHER_FREELANCER_PROPOSAL_ID/withdraw \
  -H "Authorization: Bearer YOUR_FREELANCER_TOKEN"
```

**Expected Response:** `403 Forbidden` - "You are not authorized to withdraw this proposal"

---

## Complete Workflow Test

Here's a complete end-to-end workflow:

```bash
# 1. Client creates project
CLIENT_TOKEN="your-client-token"
PROJECT_RESPONSE=$(curl -X POST http://localhost:5000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{
    "title": "E-commerce Website Development",
    "description": "Need a full-featured e-commerce website with payment integration, product catalog, shopping cart, and admin panel. Must be built with modern technologies and be scalable.",
    "category_id": "web-dev-category-uuid",
    "budget_min": 2000,
    "budget_max": 5000,
    "deadline": "2026-03-01",
    "skills_required": ["Node.js", "React", "PostgreSQL", "Payment Integration"]
  }')

# Extract PROJECT_ID from response

# 2. Multiple freelancers submit proposals
FREELANCER1_TOKEN="freelancer1-token"
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELANCER1_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID",
    "cover_letter": "I am an experienced full-stack developer with 7 years of experience building e-commerce platforms. I have successfully delivered 15+ e-commerce projects with payment integrations including Stripe, PayPal, and local payment gateways. I can deliver a scalable, secure solution within your timeline.",
    "proposed_budget": 4500,
    "delivery_time": 90
  }'

FREELANCER2_TOKEN="freelancer2-token"
curl -X POST http://localhost:5000/api/v1/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELANCER2_TOKEN" \
  -d '{
    "project_id": "PROJECT_ID",
    "cover_letter": "Hello! I specialize in building modern e-commerce solutions using React and Node.js. I have expertise in integrating multiple payment gateways and can provide a fully responsive, SEO-optimized platform. My recent project for a fashion retailer increased their sales by 40%.",
    "proposed_budget": 3800,
    "delivery_time": 75
  }'

# 3. Client reviews all proposals
curl -X GET http://localhost:5000/api/v1/proposals/project/PROJECT_ID \
  -H "Authorization: Bearer $CLIENT_TOKEN"

# 4. Client accepts one proposal (others auto-rejected)
curl -X PUT http://localhost:5000/api/v1/proposals/FREELANCER2_PROPOSAL_ID/accept \
  -H "Authorization: Bearer $CLIENT_TOKEN"

# 5. Verify project status changed to in_progress
curl -X GET http://localhost:5000/api/v1/projects/PROJECT_ID

# 6. Freelancer1 checks their proposals (should see rejected status)
curl -X GET http://localhost:5000/api/v1/proposals/my-proposals \
  -H "Authorization: Bearer $FREELANCER1_TOKEN"
```

---

## Database Queries for Verification

```sql
-- View all proposals
SELECT p.id, p.status, pr.title as project, u.email as freelancer 
FROM proposals p
JOIN projects pr ON p.project_id = pr.id
JOIN users u ON p.freelancer_id = u.id;

-- Count proposals by status
SELECT status, COUNT(*) 
FROM proposals 
GROUP BY status;

-- View proposals with freelancer details
SELECT 
  p.id,
  p.proposed_budget,
  p.delivery_time,
  p.status,
  prof.full_name as freelancer_name,
  proj.title as project_title
FROM proposals p
JOIN users u ON p.freelancer_id = u.id
JOIN profiles prof ON u.id = prof.user_id
JOIN projects proj ON p.project_id = proj.id;
```

---

## Testing Checklist

- [ ] Freelancer can submit proposal on open project
- [ ] Freelancer cannot submit duplicate proposal
- [ ] Client cannot submit proposal on own project
- [ ] Cover letter validation works (min 100 chars)
- [ ] Budget validation works (must be positive)
- [ ] Delivery time validation works (1-365 days)
- [ ] Freelancer can view all their proposals
- [ ] Client can view all proposals on their project
- [ ] Other users cannot view proposals
- [ ] Client can accept a proposal
- [ ] Accepting a proposal changes project status to in_progress
- [ ] Accepting a proposal auto-rejects other pending proposals
- [ ] Client can reject a proposal
- [ ] Freelancer can withdraw pending proposal
- [ ] Freelancer cannot withdraw accepted/rejected proposal
- [ ] Cannot accept/reject already processed proposals

---

## API Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/v1/proposals` | POST | Freelancer | Submit proposal |
| `/api/v1/proposals/my-proposals` | GET | Freelancer | View my proposals |
| `/api/v1/proposals/project/:projectId` | GET | Client/Admin | View project proposals |
| `/api/v1/proposals/:id` | GET | Owner/Client/Admin | View single proposal |
| `/api/v1/proposals/:id/accept` | PUT | Client/Admin | Accept proposal |
| `/api/v1/proposals/:id/reject` | PUT | Client/Admin | Reject proposal |
| `/api/v1/proposals/:id/withdraw` | PUT | Freelancer | Withdraw proposal |

**Total Endpoints:** 7
