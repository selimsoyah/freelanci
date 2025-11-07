# FreeTun 🇹🇳

**Tunisian Freelance Marketplace - Empowering Local Talent**

![Status](https://img.shields.io/badge/status-in_development-yellow)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## FreeTun – MVP Project Brief
1. Project Overview
FreeTun (Freelance Tunisia) – A user-friendly freelance marketplace designed to empower
Tunisian freelancers and small businesses with a fair, accessible, and local-first platform.
1.1 Vision Statement
To democratize freelance work in Tunisia by offering a simple, trustworthy, and paymentaccessible platform that connects local talents with local opportunities — while providing
fair, transparent income generation for the platform and its users.
1.2 Core Idea
A web-based freelance marketplace tailored for the Tunisian ecosystem, solving barriers
related to payment limitations, accessibility for beginners, language mismatch, and trust
between clients and freelancers.
2. Objectives of the MVP
The MVP aims to validate three key hypotheses:
1. There is strong local demand for a freelance platform using Tunisian-friendly payments.
2. Freelancers and clients will engage with a simple, transparent system.
3. A fair commission model can sustain profit without exploiting users.
3. Core MVP Features
Core roles: Freelancer, Client, and Admin. Each has distinct permissions and views.
3.1 Authentication and Profile System
• Login via email, phone, or Google.
• Verification via Tunisian ID or SMS.
• Localized interface in French and Arabic.
Purpose: Simplify onboarding while ensuring trust.
3.2 Project Posting and Browsing
Clients can post jobs with title, description, budget (in TND), and attachments.
Freelancers can browse and apply with proposals.
Purpose: Enable transparent job discovery and easy access for beginners.
3.3 Payment System (Tunisian-Friendly)
Supported methods: D17, Flouci, bank transfer, and eDinar Smart.
Escrow model: funds held until work completion.
Purpose: Build trust and protect both parties.
3.4 Communication System
• In-platform chat and file uploads.
• Email + in-app notifications.
Purpose: Maintain transparent communication.
3.5 Ratings & Reviews
After project completion, both client and freelancer rate each other (1–5 stars).
Purpose: Encourage professionalism and accountability.
3.6 Admin Dashboard
Admin tools to manage users, payments, and disputes.
Purpose: Ensure platform security and smooth operation.
4. User Experience Guidelines
• Simple, mobile-first design.
• French-first interface with Arabic toggle.
• Clean dashboard with minimal steps to start.
Purpose: Make the platform intuitive for all users.
5. Business Model
Revenue streams:
1. Low transaction commission (5% freelancer, 2% client)
2. Premium subscriptions for visibility boosts.
3. Institutional partnerships with universities/companies.
Profit philosophy: Help first, earn second.
6. Technology Stack
Frontend: React.js / Next.js
Backend: Node.js (Express) or Django REST
Database: PostgreSQL
Payments: Flouci API, D17 API
Hosting: AWS / Render / OVH
7. Launch & Validation Plan
Phase 1: Prototype (Months 1–2) – Build core backend and UI mockups.
Phase 2: MVP Launch (Months 3–5) – Launch beta with limited users and payments.
Phase 3: Public Rollout (Month 6+) – Introduce premium plans and expand nationally.
8. Success Metrics (KPIs)
• User Activation
• Project Completion Rate
• Retention
• Payment Success Rate
• NPS (User Satisfaction)
9. Long-Term Vision
Expand to North Africa and Francophone Africa.
Introduce cross-border hiring and AI job matching.
Build mobile apps and certifications for verified freelancers.
10. Ethical & Social Impact
FreeTun aims to reduce unemployment, promote digital literacy, and empower Tunisians to
earn income sustainably and ethically.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm or yarn

### 1. Clone & Install

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Frontend setup (in a new terminal)
cd frontend
npm install
cp .env.example .env.local
```

### 2. Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE freetun_db;
CREATE USER freetun_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE freetun_db TO freetun_user;
\q
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### 4. Verify Setup

- Backend health: http://localhost:5000/health
- Frontend: http://localhost:3000

---

## 📁 Project Structure

```
freelanci/
├── backend/           # Node.js + Express + TypeScript API
├── frontend/          # Next.js + React + TypeScript
├── docs/              # Documentation
├── DEVELOPMENT_PLAN.md
├── PROJECT_STRUCTURE.md
└── README.md
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed structure.

---

## 🆓 Free Services Used

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Frontend hosting | Unlimited for personal |
| **Render.com** | Backend hosting | 750 hrs/month free |
| **Railway.app** | Database + Backend | $5 credit/month |
| **SendGrid** | Email service | 100 emails/day |
| **Sentry** | Error tracking | 5K errors/month |

---

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [Detailed Development Plan](DEVELOPMENT_PLAN.md)
- [Project Structure](PROJECT_STRUCTURE.md)

---

## 🛣️ Development Roadmap

### Phase 1-2: Setup & Infrastructure ✅
- [x] Project initialization
- [x] Backend setup (Node.js + TypeScript + Express)
- [x] Frontend setup (Next.js 16 + TypeScript + Tailwind v4)
- [x] Database configuration (PostgreSQL)
- [x] Environment setup & deployment config

### Phase 3: Authentication System ✅
- [x] User model & Profile model
- [x] JWT authentication (access + refresh tokens)
- [x] Password hashing (bcrypt)
- [x] Register/Login endpoints
- [x] Role-based access control (freelancer/client/admin)

### Phase 4: Project Posting System ✅
- [x] Category model & seeding
- [x] Project model with validation
- [x] CRUD operations for projects
- [x] Search, filter, and pagination
- [x] Role-based project management
- [x] Testing documentation

### Phase 5: Proposal System ✅ (CURRENT)
- [x] Proposal model with constraints
- [x] Submit proposal (freelancers)
- [x] View proposals (clients/freelancers)
- [x] Accept/Reject proposals
- [x] Auto-reject competing proposals
- [x] Project status automation
- [x] 7 API endpoints with validation

### Phase 6: Payment Integration (NEXT)
- [ ] Payment gateway integration (Flouci, D17, eDinar)
- [ ] Escrow system
- [ ] Transaction model
- [ ] Release & refund mechanisms
- [ ] Commission calculation

### Phase 7-10: Advanced Features
- [ ] Real-time messaging (Socket.IO)
- [ ] Reviews & ratings
- [ ] Admin dashboard
- [ ] Notification system

### Phase 11: Frontend Development
- [ ] Authentication pages
- [ ] Dashboard layouts
- [ ] Project browsing & creation
- [ ] Proposal management UI
- [ ] Payment interface

### Phase 12: Testing & Launch
- [ ] Beta testing
- [ ] Production deployment
- [ ] Monitoring & analytics

**Progress: 29% (5 of 17 weeks completed)**

**Current API Status:**
- ✅ 4 Authentication endpoints
- ✅ 6 Project endpoints
- ✅ 7 Proposal endpoints
- **Total: 17 backend endpoints ready**

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📞 Contact & Support

- **GitHub**: [selimsoyah/Freelanci](https://github.com/selimsoyah/Freelanci)
- **Project**: FreeTun - Tunisian Freelance Marketplace

---

## 📄 License

ISC License - FreeTun Team

---

**Built with ❤️ for Tunisia 🇹🇳**