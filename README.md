# Golf Charity Subscription Platform

A full-stack application where golfers pay a monthly subscription and participate in lottery draws while supporting charities.

## Project Structure

### Frontend (React + Vite)
- **Location:** `/src`
- **Dev Server:** `npm run dev` (port 5173)
- **Build:** `npm run build`
- **Tech Stack:** React 19, TanStack Router, Axios, Tailwind CSS v4

### Backend (Express + Node.js)
- **Location:** `/server`
- **Dev Server:** `npm run dev` (port 5000)
- **Tech Stack:** Express, PostgreSQL, JWT, Stripe, bcryptjs

## Quick Start

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Environment Variables

**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:5000
```

**Backend (server/.env.local):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/golf_charity
JWT_SECRET=your-jwt-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
PORT=5000
```

## Database Setup

Run SQL migrations in order:
1. `scripts/01-schema.sql` - Create all tables
2. `scripts/02-rls-policies.sql` - Set up row-level security
3. `scripts/03-sample-data.sql` - Load sample charities
4. `scripts/04-add-password.sql` - Add password column if needed

## Features

### User Features
- **Authentication:** Email/password signup and login
- **Subscriptions:** Monthly/yearly plans via Stripe
- **Score Tracking:** Enter up to 5 recent golf scores (Stableford 1-45)
- **Charity Selection:** Choose a charity and set contribution percentage (10-100%)
- **Winnings:** Track lottery prizes and verification status
- **Dashboard:** Overview of subscription, scores, and winnings

### Admin Features
- **User Management:** View and manage subscribers
- **Draw Simulation:** Simulate monthly lottery draws
- **Draw Publication:** Publish results and determine winners
- **Winner Verification:** Review and verify winner submissions
- **Payout Management:** Mark prizes as paid out
- **Reports:** Revenue, participation, and charity contribution analytics

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Subscriptions
- `GET /api/subscriptions/plans` - Available plans
- `GET /api/subscriptions/status` - User's subscription status
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/subscriptions/webhook` - Stripe webhooks

### Golf Scores
- `POST /api/scores` - Add a score
- `GET /api/scores` - Get user's scores
- `PATCH /api/scores/:id` - Update a score
- `DELETE /api/scores/:id` - Delete a score

### Charities
- `GET /api/charities` - List all charities
- `GET /api/charities/:id` - Get charity details
- `POST /api/user/charity` - Select charity
- `GET /api/user/charity` - Get user's selected charity

### Draws & Winnings
- `GET /api/draws/current` - Current month's draw
- `GET /api/draws/history` - Previous draws
- `GET /api/winners` - User's winnings
- `POST /api/winners/verify` - Submit verification proof

### Admin Endpoints
- `GET /api/admin/users` - List users
- `GET /api/admin/winners` - List all winners for verification
- `PATCH /api/admin/winners/:id/verify` - Verify winner
- `PATCH /api/admin/winners/:id/payout` - Mark as paid
- `POST /api/draws/simulate` - Simulate draw
- `POST /api/draws/publish` - Publish results
- `GET /api/admin/reports` - Generate reports

## Database Schema

### Core Tables
- **users** - User accounts with authentication
- **subscriptions** - Active subscription tracking
- **golf_scores** - User's golf scores (5-score rolling window)
- **charities** - Charity organizations
- **user_charity_selection** - User's chosen charity & contribution %
- **draws** - Monthly lottery draws
- **winners** - Winners and their prizes
- **winner_verification** - Proof submissions from winners

## Component Structure

### Pages
- `LandingPage` - Homepage
- `LoginPage` / `SignupPage` - Authentication
- `CheckoutPage` - Subscription selection
- `DashboardPage` - User dashboard
- `ScoresPage` - Score history & management
- `CharitySelectionPage` - Choose charity
- `CharitiesPage` - Browse charities
- `WinningsPage` - View prizes
- Admin pages for management

### Components
- `Navigation` - Top navigation with auth links
- `Footer` - Footer component
- UI components: Card, Button, Input, Badge, Slider

## Security

- JWT authentication with token refresh
- Password hashing with bcryptjs
- Row-level security on database
- Admin role-based access control
- CORS enabled for frontend origin only
- Environment variables for secrets

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static host:
```bash
npm run build
# Upload dist/ folder
```

### Backend
Deploy to Railway, Heroku, or any Node.js host:
```bash
cd server
npm run build
# Set DATABASE_URL and other env vars
```

## Error Handling

- Tailwind CSS v4 properly configured with `@tailwindcss/postcss`
- All UI components created locally (Card, Button, Input, Badge, Slider)
- API error handling with token expiration redirect
- Form validation on frontend and backend

## Next Steps

1. Connect to PostgreSQL database
2. Add Stripe keys for payments
3. Set JWT_SECRET in environment
4. Run database migrations
5. Deploy frontend and backend
6. Configure Stripe webhook endpoints

## License

Proprietary - Golf Charity Platform
