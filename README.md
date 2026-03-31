# FreightLink TMS

A comprehensive freight transportation management system with React frontend and Express.js backend.

## Features

- 🚚 Load Management & Tracking
- 📦 Carrier & Shipper Management  
- 🤖 AI-Powered Dispatch (Anthropic)
- 💳 Stripe Billing Integration
- 📊 Analytics & Reporting
- 🌍 Multi-Region Support (Kenya, India, Canada, US)
- 🔐 JWT Authentication
- 📧 Email Notifications

## Tech Stack

**Frontend**: React 19, Vite, TailwindCSS, Lucide Icons
**Backend**: Express.js, SQLite, JWT, Stripe, Anthropic AI
**Database**: SQLite with automated backups

## Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate JWT secret (required)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add the generated secret to JWT_SECRET in .env

# Update .env with your credentials:
# - SMTP settings for email
# - Stripe keys for billing
# - Anthropic API key for AI features
```

### 2. Installation

```bash
npm install
```

### 3. Database Setup

The SQLite database is automatically created and seeded with demo data on first run.

### 4. Running the Application

**Option A: Separate Terminals (Recommended)**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev:client
```

**Option B: Single Terminal**
```bash
npm run dev
```

### 5. Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## Demo Accounts

Use any of these credentials to login:

- 🇰🇪 Kenya: `admin@freightlink.co.ke` / `admin123`
- 🇮🇳 India: `admin@freightlink.in` / `admin123`
- 🇨🇦 Canada: `admin@freightlink.ca` / `admin123`
- 🇺🇸 US: `admin@freightlink.us` / `admin123`

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/loads` - Load management
- `GET /api/carriers` - Carrier directory
- `GET /api/analytics` - Reports & analytics
- `POST /api/billing` - Stripe payments

## Development

### Available Scripts

```bash
npm run dev:server    # Start backend only
npm run dev:client    # Start frontend only
npm run dev          # Start both (concurrently)
npm run build        # Build for production
npm run start:server # Production server
npm run lint         # ESLint check
```

### Database

- Location: `./server/data/freightlink.db`
- Auto-backup: Daily at 2 AM (keeps 7 days)
- Seeded with: Kenya, India, Canada, US demo data

## Environment Variables

See `.env.example` for all available variables. Key ones:

```bash
NODE_ENV=development
API_PORT=3001
JWT_SECRET=your-64-char-secret
FRONTEND_URL=http://localhost:5173

# Optional features
SMTP_HOST=smtp.gmail.com
STRIPE_SECRET_KEY=sk_test_...
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

## Production Deployment

```bash
# Build frontend
npm run build

# Start production server
npm run start:server
```

Or use Docker:

```bash
docker-compose up -d
```
