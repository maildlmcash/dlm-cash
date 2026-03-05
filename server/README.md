# 🚀 DLM Crypto Backend - ROI Investment Platform

> A production-ready, comprehensive Node.js backend for an ROI-based investment platform with cryptocurrency support, built with TypeScript, Express, Prisma, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-blueviolet)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## ⚡ Quick Start

Get up and running in under 5 minutes!

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database URL

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start development server
npm run dev
```

**🎉 Your backend is now running at http://localhost:5000!**

📖 [Read the Quick Start Guide](./QUICKSTART.md) for detailed instructions.

---

## 🚀 Features

### User Management
- User registration with referral system
- JWT-based authentication
- Role-based access control (USER, ADMIN, SUPER_ADMIN, KYC_MANAGER, FINANCE, etc.)
- Profile management
- Multi-level referral tracking (up to 10 levels)

### Wallet System
- Multiple wallet types (INR, USDT, ROI, SALARY, BREAKDOWN)
- Real-time balance tracking
- Transaction history
- Pending balance management

### Investment & Plans
- Flexible investment plans with configurable ROI
- Daily, Weekly, and Monthly ROI distribution
- Automated ROI calculations via cron jobs
- Investment tracking and management
- Breakdown wallet allocation (80/20 split)

### Deposit & Withdrawal
- Multiple deposit methods (UPI, NEFT, IMPS, Manual, Blockchain)
- Multiple withdrawal methods (UPI, Bank, TRC20, ERC20)
- Admin approval workflow
- Transaction proof uploads
- Automated wallet updates

### KYC Management
- Document upload (PAN, Aadhaar, Passport, etc.)
- Selfie verification
- Admin approval/rejection workflow
- KYC status tracking

### Referral System
- Multi-level commission structure (10 levels)
- Automatic commission calculation
- Level-wise commission rates
- Referral income tracking

### Admin Panel
- Dashboard with comprehensive statistics
- User management (view, update status, change roles)
- KYC approval/rejection
- Deposit approval/rejection
- Withdrawal approval/rejection
- Transaction monitoring
- Investment tracking

### Automated Cron Jobs
- Daily ROI calculation and distribution
- Monthly salary calculation
- Investment expiry management
- Automated wallet updates

## 📁 Project Structure

```
dlm-crypto-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma client configuration
│   │   └── index.ts             # App configuration
│   ├── controllers/
│   │   ├── authController.ts    # Authentication & user profile
│   │   ├── walletController.ts  # Wallet & transaction management
│   │   ├── depositController.ts # Deposit operations
│   │   ├── withdrawalController.ts # Withdrawal operations
│   │   ├── investmentController.ts # Investment & plans
│   │   ├── kycController.ts     # KYC document management
│   │   └── adminController.ts   # Admin panel operations
│   ├── middleware/
│   │   ├── auth.ts              # Authentication & authorization
│   │   ├── errorHandler.ts      # Global error handling
│   │   ├── notFoundHandler.ts   # 404 handler
│   │   ├── validator.ts         # Request validation
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── walletRoutes.ts
│   │   ├── depositRoutes.ts
│   │   ├── withdrawalRoutes.ts
│   │   ├── investmentRoutes.ts
│   │   ├── kycRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── index.ts
│   ├── schedulers/
│   │   ├── index.ts
│   │   └── jobs/
│   │       ├── roiCalculation.ts
│   │       └── salaryCalculation.ts
│   ├── utils/
│   │   ├── auth.ts              # Auth utilities
│   │   ├── response.ts          # Response helpers
│   │   ├── upload.ts            # File upload
│   │   └── calculations.ts      # ROI & commission calculations
│   └── server.ts                # Application entry point
├── prisma/
│   └── schema.prisma            # Database schema
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 🛠️ Installation

1. **Clone the repository**
```bash
cd dlm-crypto-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure your database and other settings:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dlm_crypto"
JWT_SECRET="your-secret-key"
PORT=5000
```

4. **Run Prisma migrations**
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start the development server**
```bash
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Wallets & Transactions
- `GET /api/user/wallets` - Get all user wallets
- `GET /api/user/wallets/:type` - Get specific wallet
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/transactions/:id` - Get transaction details

### Deposits
- `POST /api/deposits` - Create deposit request
- `GET /api/deposits` - Get user deposits
- `GET /api/deposits/:id` - Get deposit details

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals` - Get user withdrawals
- `GET /api/withdrawals/:id` - Get withdrawal details

### Investments
- `GET /api/invest/plans` - Get all plans
- `GET /api/invest/plans/:id` - Get plan details
- `POST /api/invest/investments` - Create investment
- `GET /api/invest/investments` - Get user investments
- `GET /api/invest/investments/:id` - Get investment details

### KYC
- `POST /api/kyc/upload` - Upload KYC documents
- `GET /api/kyc/my` - Get user KYC documents
- `GET /api/kyc/status` - Get KYC status

### Admin Panel
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/kyc/pending` - Get pending KYC
- `POST /api/admin/kyc/:id/approve` - Approve KYC
- `POST /api/admin/kyc/:id/reject` - Reject KYC
- `GET /api/admin/deposits/pending` - Get pending deposits
- `POST /api/admin/deposits/:id/approve` - Approve deposit
- `POST /api/admin/deposits/:id/reject` - Reject deposit
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/withdrawals/:id/reject` - Reject withdrawal

## 🔐 Authentication

All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 👥 User Roles

- `USER` - Regular user
- `ADMIN` - Administrator with full access
- `SUPER_ADMIN` - Super administrator
- `KYC_MANAGER` - Can manage KYC approvals
- `FINANCE` - Can manage deposits/withdrawals
- `SUPPORT` - Support staff
- `STAFF` - General staff
- `DISTRIBUTOR` - Distributor role
- `WHITE_LABEL` - White label partner

## 💰 Referral Commission Structure

- Level 1: 10%
- Level 2: 5%
- Level 3: 3%
- Level 4-5: 2%
- Level 6-10: 1%

## ⏰ Cron Jobs

### Daily ROI Calculation
- Runs every day at midnight (configurable)
- Calculates and distributes daily ROI to active investments
- Credits ROI wallet
- Creates transaction records
- Marks expired investments as completed

### Monthly Salary Calculation
- Runs on 1st of every month (configurable)
- Calculates salary-based payouts
- Credits salary wallet
- Creates salary logs

## 🗄️ Database Schema

The database includes the following main models:
- User
- Wallet
- Transaction
- Plan
- Investment
- Deposit
- Withdrawal
- KycDocument
- ReferralIncome
- SalaryLog
- Notification
- SupportTicket
- BlogPost, BlogCategory, Comment
- Setting
- WhiteLabelPartner
- CurrencyRate
- StaffActivityLog

## 🔧 Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

## 🚀 Deployment

1. Build the project:
```bash
npm run build
```

2. Set environment variables in production

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Start the server:
```bash
npm start
```

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Input validation
- Role-based access control
- File upload validation

## 📄 License

ISC

## 👨‍💻 Support

For support and questions, contact the development team.
