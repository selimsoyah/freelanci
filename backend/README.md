# FreeTun Backend API

Backend API for FreeTun - Tunisian Freelance Marketplace

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO for messaging
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration:
- Database credentials
- JWT secrets
- Email configuration
- Payment gateway credentials (Flouci, D17)

### 3. Set Up Database

Install PostgreSQL and create a database:

```bash
sudo -u postgres psql
CREATE DATABASE freetun_db;
CREATE USER freetun_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE freetun_db TO freetun_user;
\q
```

Update your `.env` file with these credentials.

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (database, etc.)
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, error handling, etc.)
│   ├── models/          # Database models (Sequelize)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types and interfaces
│   ├── utils/           # Utility functions
│   └── server.ts        # Main application file
├── tests/               # Test files
├── uploads/             # Uploaded files (gitignored)
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - API health status

### Authentication (Coming Soon)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/refresh-token` - Refresh JWT token

### Users (Coming Soon)
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Projects (Coming Soon)
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details

### Proposals (Coming Soon)
- `POST /api/v1/proposals` - Submit proposal
- `GET /api/v1/proposals` - List user proposals

### Payments (Coming Soon)
- `POST /api/v1/payments/initiate` - Initiate payment
- `POST /api/v1/payments/confirm` - Confirm payment

### Messages (Coming Soon)
- `GET /api/v1/messages` - Get conversations
- `POST /api/v1/messages` - Send message

## 🔒 Security Features

- ✅ Helmet.js for secure HTTP headers
- ✅ CORS configuration
- ✅ Rate limiting on all endpoints
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ SQL injection protection (Sequelize ORM)

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Payment System Testing

The payment system has been thoroughly tested with 25 test scenarios covering:

- ✅ Fee calculation (5% client, 2% freelancer)
- ✅ Complete payment flow (initiate → verify → release)
- ✅ Refund and dispute resolution
- ✅ Transaction history and filtering
- ✅ Error handling and edge cases
- ✅ Authorization and access control

**Test Documentation:**
- `TEST_PAYMENT_API.md` - Comprehensive testing guide with curl examples
- `PAYMENT_SYSTEM_TEST_RESULTS.md` - Detailed test results and validation report

**Test Scripts:**
- `src/scripts/createTestUsers.ts` - Create test users for all roles
- `src/scripts/mockPaymentVerification.ts` - Mock payment gateway verification

**Test Users:**
```bash
# Create test users
npx ts-node src/scripts/createTestUsers.ts

# Test credentials (after creation):
# Client: client@test.com / Test123!@#
# Freelancer: freelancer@test.com / Test123!@#
# Admin: admin@test.com / Test123!@#
```

**Success Rate:** 100% (25/25 tests passed)

## 📦 Free Services Used

- **Database**: PostgreSQL (self-hosted or Railway.app free tier)
- **Email**: Gmail SMTP or SendGrid free tier (100 emails/day)
- **Hosting**: Render.com free tier or Railway.app
- **File Storage**: Local filesystem (for MVP)

## 🚀 Deployment

### Using Render.com (Free)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables from `.env.example`

### Using Railway.app (Free)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## 📄 License

ISC License - FreeTun Team
