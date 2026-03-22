<div align="center">

<img src="https://papermarket-web.vercel.app/logo.png" alt="PaperMarket" width="80" />

# PaperMarket

**Trade on real-world events. No money, no risk — pure strategy.**

[![Live # of Users](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpapermarket-production.up.railway.app%2Fapi%2Fstats&query=%24.userCount&label=live%20%23%20of%20users&color=4ade80&style=flat-square)](https://papermarket-web.vercel.app)
[![Polymarket Synced](https://img.shields.io/badge/data-polymarket-6366f1?style=flat-square)](https://polymarket.com)
[![Deployed on Vercel](https://img.shields.io/badge/frontend-vercel-black?style=flat-square&logo=vercel)](https://papermarket-web.vercel.app)
[![API on Railway](https://img.shields.io/badge/api-railway-7c3aed?style=flat-square)](https://railway.app)

[**Live Demo →**](https://papermarket-web.vercel.app)

<br />

<img src="https://image.thum.io/get/width/1300/crop/800/https://papermarket-web.vercel.app" alt="PaperMarket Homepage" width="100%" style="border-radius:12px" />

<br /><br />

<img src="https://image.thum.io/get/width/1300/crop/800/https://papermarket-web.vercel.app/leaderboard" alt="Leaderboard" width="48%" />
<img src="https://image.thum.io/get/width/1300/crop/800/https://papermarket-web.vercel.app/markets" alt="Markets" width="48%" />

</div>

---

## What is PaperMarket?

PaperMarket is a paper-trading prediction market platform powered by live data from [Polymarket](https://polymarket.com). Every new user gets **$1,000 in free play money** to trade on real-world outcomes — politics, crypto, sports, tech, and more.

Markets sync automatically from Polymarket every 10 minutes, so probabilities reflect real-world sentiment in near real-time.

---

## Features

| | |
|---|---|
| 📈 **Live Markets** | Synced from Polymarket every 10 minutes |
| 💸 **Paper Trading** | $1,000 free play money, no financial risk |
| 📊 **Portfolio Tracking** | P&L, positions, trade history |
| 🏆 **Leaderboard** | Compete against other traders globally |
| 🔐 **Auth** | Email/password + Google OAuth |
| 🛠 **Admin Panel** | Resolve markets, manage users, sync data |
| 📱 **Responsive** | Works on desktop and mobile |

---

## Stack

\`\`\`
Frontend    React 18 · TypeScript · Tailwind CSS · Vite
Backend     Node.js · Express · Prisma ORM
Database    PostgreSQL
Auth        JWT + Google OAuth 2.0
Data        Polymarket Gamma API
Hosting     Vercel (web) · Railway (api + db)
\`\`\`

---

## Local Development

**Prerequisites:** Docker Desktop, Node.js 18+

\`\`\`bash
# 1. Clone
git clone https://github.com/natedemoss/papermarket.git
cd papermarket

# 2. Set up environment
cp .env.example .env
# Fill in JWT secrets, Google OAuth credentials, admin password

# 3. Start services
docker-compose build
docker-compose up -d

# 4. Set up database
docker exec papermarket-api npx prisma db push \
  --schema /app/apps/api/prisma/schema.prisma --accept-data-loss
docker exec papermarket-api node prisma/seed.js

# 5. Open
open http://localhost:3000
\`\`\`

---

## Environment Variables

| Variable | Description |
|---|---|
| \`DATABASE_URL\` | PostgreSQL connection string |
| \`JWT_SECRET\` | Secret for signing JWT tokens |
| \`GOOGLE_CLIENT_ID\` | Google OAuth client ID |
| \`GOOGLE_CLIENT_SECRET\` | Google OAuth client secret |
| \`GOOGLE_CALLBACK_URL\` | Full URL for OAuth callback |
| \`FRONTEND_URL\` | Frontend base URL (for CORS + redirects) |
| \`ADMIN_EMAIL\` | Email of the admin account |
| \`ADMIN_PASSWORD\` | Password for the admin account |
| \`POLYMARKET_SYNC_ENABLED\` | \`true\` to enable auto market sync |

See \`.env.example\` for the full list.

---

## How It Works

1. **Markets** are pulled from Polymarket's public API and stored in Postgres
2. **Users** trade YES/NO shares — price reflects current market probability
3. **Price impact** — each trade slightly shifts the market probability
4. **Payouts** — when a market resolves, winners receive their payout based on entry price
5. **Leaderboard** — ranked by portfolio value in real time

---

<div align="center">

Made with ☕ · Data from [Polymarket](https://polymarket.com)

</div>
