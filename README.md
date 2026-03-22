# PaperMarket

[![Live # of Traders](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpapermarket-production.up.railway.app%2Fapi%2Fstats&query=%24.userCount&label=traders&color=4ade80&style=flat-square)](https://papermarket-web.vercel.app)

A paper-trading prediction market platform powered by live data from [Polymarket](https://polymarket.com). Trade on real-world outcomes with $1,000 in play money — no financial risk.

## Stack

- **Frontend** — React 18, TypeScript, Tailwind CSS, Vite
- **Backend** — Node.js, Express, Prisma ORM
- **Database** — PostgreSQL
- **Auth** — JWT + Google OAuth
- **Data** — Polymarket Gamma API (syncs every 10 minutes)

## Features

- Live market probabilities synced from Polymarket
- YES/NO trading with real price impact
- Portfolio tracking and P&L
- Global leaderboard
- Google OAuth and email/password auth
- Admin panel

## Local Development

**Prerequisites:** Docker Desktop

1. Clone the repo and copy the env file:
   ```
   git clone https://github.com/natedemoss/papermarket.git
   cd papermarket
   cp .env.example .env
   ```

2. Fill in `.env` with your credentials (JWT secrets, Google OAuth, admin password).

3. Build and start:
   ```
   docker-compose build
   docker-compose up -d
   ```

4. Run migrations and seed:
   ```
   docker exec papermarket-api npx prisma db push --schema /app/apps/api/prisma/schema.prisma --accept-data-loss
   docker exec papermarket-api node prisma/seed.js
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables.
