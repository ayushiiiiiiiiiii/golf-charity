# Setup Guide - Golf Charity Platform

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 12+ (or use a cloud provider like Supabase)
- Stripe account for payment processing

## Step 1: Database Setup

### Option A: Local PostgreSQL
```bash
createdb golf_charity
psql golf_charity < scripts/01-schema.sql
psql golf_charity < scripts/02-rls-policies.sql
psql golf_charity < scripts/03-sample-data.sql
psql golf_charity < scripts/04-add-password.sql
```

### Option B: Supabase (Cloud)
1. Create account at supabase.com
2. Create new project
3. Go to SQL Editor → Run each migration file in order:
   - 01-schema.sql
   - 02-rls-policies.sql
   - 03-sample-data.sql
   - 04-add-password.sql
4. Copy the DATABASE_URL from Settings → Database

## Step 2: Backend Setup

```bash
cd server
npm install

# Create .env.local file
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/golf_charity
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5173
PORT=5000
EOF

# Start development server
npm run dev
```

**Backend will be available at:** http://localhost:5000

## Step 3: Frontend Setup

```bash
npm install

# Create .env.local file
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000
EOF

# Start development server
npm run dev
```

**Frontend will be available at:** http://localhost:5173

## Step 4: Verify Setup

### Check Backend Health
```bash
curl http://localhost:5000/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### Test User Registration
1. Go to http://localhost:5173
2. Click "Get Started"
3. Fill out signup form
4. You should be redirected to checkout

## Step 5: Stripe Setup (Optional but Recommended)

1. Get test keys from https://dashboard.stripe.com/test/apikeys
2. Add to server/.env.local:
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET (from Webhooks section)

3. For webhook testing locally:
   ```bash
   npm install -g stripe
   stripe listen --forward-to localhost:5000/api/subscriptions/webhook
   ```

## Step 6: Create Admin User (Optional)

Connect to database and run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

## Troubleshooting

### "DATABASE_URL is not set"
- Check server/.env.local exists and has DATABASE_URL
- Verify PostgreSQL is running
- Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### "Cannot find module @/components/ui/card"
- All UI components are in `src/components/ui/`
- If getting 404s, ensure files exist:
  - card.tsx, button.tsx, input.tsx, badge.tsx, slider.tsx

### Tailwind CSS not working
- PostCSS config uses `@tailwindcss/postcss`
- Run `npm install` to ensure all dependencies present
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

### CORS errors from frontend
- Backend CORS is configured for http://localhost:5173
- If running on different port, update `server/src/app.ts` CORS origin

### Port already in use
- Frontend (5173): Kill with `lsof -ti:5173 | xargs kill -9`
- Backend (5000): Kill with `lsof -ti:5000 | xargs kill -9`

## Database Migrations Explained

### 01-schema.sql
Creates all tables:
- users, subscriptions, golf_scores
- charities, user_charity_selection
- draws, winners, winner_verification
- draw_results, payment_history

### 02-rls-policies.sql
Sets up Row Level Security:
- Users can only see their own data
- Admins can see all data
- Public charity data is viewable by all

### 03-sample-data.sql
Inserts sample charities for testing:
- 5 featured charities
- Multiple regions and impact areas

### 04-add-password.sql
Adds password_hash column for custom authentication

## Development Tips

### Hot Reload
- Frontend: Vite auto-reloads on file changes
- Backend: Use `nodemon` for auto-restart (configured in package.json)

### Debugging
- Frontend: Chrome DevTools, React DevTools extension
- Backend: VS Code debugger, `console.log` statements

### Database Queries
- Use `psql` for direct queries:
  ```bash
  psql $DATABASE_URL
  \dt  # List tables
  \d users  # Describe users table
  SELECT * FROM users;
  ```

## Project Structure Overview

```
golf-charity-platform/
├── src/                      # React frontend
│   ├── pages/               # Page components
│   ├── components/          # Reusable components
│   ├── context/            # React context (Auth)
│   ├── lib/                # Utilities (API client)
│   ├── styles/             # CSS and Tailwind
│   └── main.tsx            # Entry point
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, CORS, etc
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Express app
│   └── package.json
├── scripts/                # SQL migrations
├── package.json            # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS config
└── README.md              # Project documentation
```

## Next Steps

1. ✅ Database is running
2. ✅ Backend started
3. ✅ Frontend started
4. 🔲 Add Stripe keys for payments
5. 🔲 Create admin user
6. 🔲 Deploy to production

## Production Deployment

### Frontend (Vercel)
```bash
npm run build
# Upload dist/ to Vercel
```

### Backend (Railway/Heroku)
```bash
cd server
npm run build
git push  # Deploy to your host
```

### Environment Variables
Set in your hosting platform:
- DATABASE_URL (production database)
- JWT_SECRET (strong random string)
- STRIPE keys
- FRONTEND_URL (your frontend domain)

## Support

For issues:
1. Check error messages in browser console and terminal
2. Review database logs
3. Verify all environment variables set
4. Ensure ports 5000 and 5173 are available
