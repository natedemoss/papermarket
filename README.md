# PaperMarket — Full-Stack Prediction Market App

A production-ready prediction market application built with React, Express, PostgreSQL, and Prisma. Trade YES/NO contracts on real-world events using play money ($1,000 starter balance). No real currency involved — pure strategy and skill.

## Features

- 🎯 **Real-Time Markets** — Live probability updates from Polymarket Gamma API
- 💰 **Play Money** — $1,000 starter balance, no financial risk
- 🏆 **Global Leaderboard** — Compete with traders worldwide
- 📊 **Portfolio Tracking** — Monitor positions and trade history
- 🔐 **Secure Authentication** — JWT-based auth with refresh tokens
- 🚀 **Scalable Architecture** — Docker, database transactions, cron jobs
- 📱 **Mobile Friendly** — Responsive React UI with Tailwind CSS

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Deployment** | Docker, Docker Compose, Fly.io, Railway |

## Prerequisites

- **Node.js** ≥ 18.0.0
- **Docker** & **Docker Compose** (for containerized dev)
- **PostgreSQL** 14+ (or use Docker)
- **.env file** with required variables (see `.env.example`)

## Quick Start

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd papermarket
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/papermarket_dev
JWT_SECRET=your-secure-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret
```

### 2. Docker Compose (Recommended for Local Dev)

Start the entire stack with one command:

```bash
docker compose up
```

This will start:
- **PostgreSQL** on port 5432
- **Backend API** on port 8080
- **Frontend** on port 3000

The database is automatically migrated and seeded on startup.

**Access the app:**
- Frontend: http://localhost:3000
- API: http://localhost:8080
- Admin credentials: `admin@papermarket.com` / `admin123` (change in production!)

### 3. Manual Setup (Without Docker)

If you prefer to run locally:

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Terminal 1: Start backend
cd apps/api
npm run dev

# Terminal 2: Start frontend
cd apps/web
npm run dev
```

**Note:** You must have PostgreSQL running locally or provide a valid `DATABASE_URL`.

## Project Structure

```
papermarket/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/
│   │   │   │   ├── api.ts      # Typed API client
│   │   │   │   └── store.ts    # Zustand stores
│   │   │   └── main.tsx
│   │   └── Dockerfile
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── middleware/     # Auth, validation, errors
│       │   ├── services/       # Business logic (trades, markets, sync)
│       │   ├── jobs/           # Cron jobs
│       │   └── types/          # TypeScript types & schemas
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── seed.ts         # Seed script
│       └── Dockerfile
│
├── docker-compose.yml          # Local dev compose
├── docker-compose.prod.yml     # Production compose
├── fly.toml                    # Fly.io config
├── railway.json                # Railway config
├── .env.example               # Environment template
└── README.md
```

## API Endpoints

### Authentication

```
POST   /api/auth/register       Create new account
POST   /api/auth/login          Sign in
POST   /api/auth/refresh        Refresh access token
POST   /api/auth/logout         Sign out (invalidates refresh token)
GET    /api/auth/me             Get current user profile
```

### Users

```
GET    /api/users/leaderboard   Top 50 traders by P&L
GET    /api/users/:id           Public user profile
PATCH  /api/users/me            Update profile (username, avatar)
```

### Markets

```
GET    /api/markets             List markets (filterable by category, sortable)
GET    /api/markets/:id         Get single market
POST   /api/markets             Create market (admin only)
POST   /api/markets/:id/resolve Resolve market with outcome (admin only)
```

### Trades

```
POST   /api/trades              Place a trade
GET    /api/trades/me           Get user's trade history (paginated)
```

### Positions

```
GET    /api/positions/me        Get open positions with current values
```

### Admin

```
POST   /api/admin/sync          Manually trigger Polymarket sync
```

## Database Schema

### User
- `id` (UUID, PK)
- `username` (unique, 3-20 chars)
- `email` (unique)
- `passwordHash` (bcrypt)
- `paperBalance` (decimal, starts at $1,000)
- `isAdmin` (boolean)
- Timestamps: `createdAt`, `updatedAt`, `lastLoginAt`

### Market
- `id` (UUID, PK)
- `title` (string)
- `category` (enum: FINANCE, CRYPTO, TECH, SCIENCE, POLITICS, SPORTS, OTHER)
- `yesProb` (0-100)
- `volume` (decimal)
- `closesAt` (timestamp)
- `resolvedAt` (timestamp, nullable)
- `resolvedYes` (boolean, nullable — null = unresolved, true = YES won, false = NO won)
- **Polymarket fields:** `polymarketId`, `polymarketSlug`, `polymarketSynced`, `imageUrl`, `description`

### Position
- `id` (UUID, PK)
- `userId`, `marketId` (FKs)
- `side` (YES | NO)
- `shares`, `avgPrice` (weighted average), `costBasis`
- **Unique:** `(userId, marketId, side)`

### Trade
- `id` (UUID, PK)
- `userId`, `marketId` (FKs)
- `side` (YES | NO)
- `shares`, `price`, `amount`
- `type` (BUY | SELL | PAYOUT)

### RefreshToken
- `id` (UUID, PK)
- `userId` (FK, unique)
- `token` (hashed)
- `expiresAt`

## Business Logic

### Trade Execution (POST /api/trades)

1. Validate user balance ≥ amount
2. Calculate shares = amount / price
   - YES side: price = yesProb / 100
   - NO side: price = (100 - yesProb) / 100
3. Deduct amount from paperBalance
4. Upsert position with weighted average price
5. Create trade record
6. Update market volume and shift probability by small amount
7. **All in a single Prisma transaction** — if anything fails, roll back

### Market Resolution (POST /api/markets/:id/resolve)

1. Mark market as resolved with outcome
2. For each position on winning side:
   - Calculate payout = shares × $1.00
   - Add payout to user's paperBalance
   - Create PAYOUT trade record
3. **Single transaction** — ensure consistency

### Polymarket Sync (Cron Job)

- **Schedule:** Every 10 minutes (configurable)
- **Source:** https://gamma-api.polymarket.com/markets
- **Logic:**
  - Fetch top 50 markets sorted by 24hr volume
  - Parse outcome prices: JSON.parse(outcomePrices)[0] = YES price (0-1 float)
  - For each market: upsert or create
  - If resolved on Polymarket → auto-resolve locally and pay out winners
- **Env var:** `POLYMARKET_SYNC_ENABLED` (set to `false` to disable)

## Authentication Flow

1. **Register:** POST `/api/auth/register` → returns `user`, `accessToken`, `refreshToken`
2. **Store tokens:** Save to localStorage
3. **API requests:** Include `Authorization: Bearer <accessToken>` header
4. **Token refresh:** When token expires (15 min), POST `/api/auth/refresh` with `refreshToken`
5. **Logout:** POST `/api/auth/logout` → invalidates all refresh tokens

## Security

- ✅ Passwords hashed with bcrypt (12 salt rounds)
- ✅ Access tokens expire in 15 minutes
- ✅ Refresh tokens expire in 7 days (stored hashed in DB)
- ✅ Rate limiting on auth endpoints (10 req/15 min per IP)
- ✅ Helmet middleware for security headers
- ✅ CORS restricted to `FRONTEND_URL`
- ✅ Admin-only endpoints check `user.isAdmin`
- ✅ Zod validation on all request bodies
- ✅ Never return `passwordHash` in responses

## Production Deployment

### Option 1: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Set up app
fly auth login
fly launch

# Set secrets
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"
fly secrets set JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
fly secrets set DB_PASSWORD="$(openssl rand -base64 24)"
fly secrets set ADMIN_PASSWORD="your-secure-password"

# Deploy
fly deploy
```

### Option 2: Railway

```bash
# Install Railway CLI
npm i -g railway

# Login and link repo
railway login
railway link

# Deploy
railway up

# Set env vars in Railway dashboard
# DATABASE_URL will be auto-set by Railway's Postgres plugin
```

### Option 3: Docker Compose (Self-Hosted)

```bash
# Update .env with production values
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Access token secret | Generate: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Generate: `openssl rand -hex 32` |
| `FRONTEND_URL` | Frontend origin (CORS) | `http://localhost:3000` or `https://yourapp.com` |
| `POLYMARKET_SYNC_ENABLED` | Enable 10-min sync cron | `true` or `false` |
| `POLYMARKET_SYNC_LIMIT` | Markets per sync run | `50` |
| `ADMIN_EMAIL` | Initial admin account | `admin@papermarket.com` |
| `ADMIN_PASSWORD` | Initial admin password | **Change in production!** |

## Development

### Running Tests

```bash
# Backend unit tests
cd apps/api
npm test

# Integration test (trade execution)
npm run test:integration
```

### TypeScript Strict Mode

Both frontend and backend run with `"strict": true`:

```bash
# Frontend
cd apps/web
npm run build

# Backend
cd apps/api
npm run build
```

### Linting

```bash
# Frontend
cd apps/web
npm run lint

# Backend (with Eslint if configured)
cd apps/api
npm run lint
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `docker ps` (if using Docker)
- Check `DATABASE_URL` in `.env`
- Verify credentials match your setup

### Port Already in Use
- Frontend: `lsof -i :3000` and `kill -9 <PID>`
- Backend: `lsof -i :8080` and `kill -9 <PID>`
- DB: `lsof -i :5432` and `kill -9 <PID>`

### Prisma Client Not Found
```bash
cd apps/api
npx prisma generate
npm install
```

### Seed Script Fails
```bash
# Reset database
npx prisma migrate reset

# Or manually run seed
npx prisma db seed
```

## Architecture Decisions

1. **Monorepo (npm workspaces)** — Shared types, single repo management
2. **Prisma ORM** — Type-safe queries, migrations, seedin
3. **JWT + Refresh tokens** — Stateless auth, long-lived sessions with security
4. **Transactions** — All multi-step operations atomic (trades, resolutions)
5. **Cron sync** — Polymarket data freshness without external webhooks
6. **Zustand stores** — Minimal frontend state, localStorage persistence
7. **Tailwind CSS** — Rapid UI development, dark theme out of the box
8. **Docker Compose** — Dev/prod parity, zero local setup needed

## Contributing

1. **Branch naming:** `feature/`, `fix/`, `chore/`
2. **Commits:** Conventional format (`feat:`, `fix:`, `docs:`)
3. **Code style:**
   - TypeScript strict mode everywhere
   - No `any` types (use generics)
   - Error handling at service layer
4. **Testing:** Add tests for new business logic

## License

MIT

## Support

For issues, questions, or feature requests, please open a GitHub issue.

---

**Built with ❤️ for prediction market enthusiasts**
