<div align="center">

<img src="https://papermarket-web.vercel.app/favicon.svg" alt="PaperMarket" width="72" />

<h1>PaperMarket</h1>

<p>Trade on real-world events with free play money. No risk, pure strategy.</p>

<p>
  <a href="https://papermarket-web.vercel.app">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpapermarket-production.up.railway.app%2Fapi%2Fstats&query=%24.userCount&label=live%20users&color=4ade80&style=flat-square" />
  </a>
  <img src="https://img.shields.io/badge/data-polymarket-6366f1?style=flat-square" />
  <img src="https://img.shields.io/badge/frontend-vercel-black?style=flat-square&logo=vercel" />
  <img src="https://img.shields.io/badge/api-railway-7c3aed?style=flat-square" />
  <a href="https://github.com/natedemoss/papermarket">
    <img src="https://img.shields.io/github/stars/natedemoss/papermarket?style=flat-square&color=f59e0b&label=star%20on%20github" />
  </a>
</p>

<a href="https://papermarket-web.vercel.app"><strong>papermarket-web.vercel.app</strong></a>

<br /><br />

<img src="https://image.thum.io/get/width/1300/crop/820/https://papermarket-web.vercel.app" alt="PaperMarket" width="100%" />

<br /><br />

<img src="https://image.thum.io/get/width/1300/crop/820/https://papermarket-web.vercel.app/markets" alt="Markets" width="49%" />
<img src="https://image.thum.io/get/width/1300/crop/820/https://papermarket-web.vercel.app/leaderboard" alt="Leaderboard" width="49%" />

</div>

<br />

---

PaperMarket is a paper-trading prediction market platform built on live data from [Polymarket](https://polymarket.com). Every account starts with **$1,000 in play money** to trade on politics, crypto, sports, tech, and more. Markets sync every 10 minutes — probabilities are always real.

---

### Features

| | |
|:--|:--|
| **Live Markets** | Synced from Polymarket every 10 minutes across all categories |
| **Paper Trading** | $1,000 free starting balance, no real money involved |
| **Price Impact** | Each trade shifts the market probability in real time |
| **Portfolio** | Track open positions, P&L, and full trade history |
| **Leaderboard** | Global ranking by portfolio value |
| **Auth** | Email/password and Google OAuth sign-in |
| **Admin Panel** | Resolve markets, adjust balances, sync market data |

---

### Stack

| Layer | Technology |
|:--|:--|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth 2.0 |
| Data | Polymarket Gamma API |
| Hosting | Vercel (web), Railway (API + database) |

---

### Local Development

**Prerequisites:** Docker Desktop, Node.js 18+

**1. Clone the repo**
```bash
git clone https://github.com/natedemoss/papermarket.git
cd papermarket
```

**2. Configure environment**
```bash
cp .env.example .env
```
Fill in `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_PASSWORD`.

**3. Start services**
```bash
docker-compose build
docker-compose up -d
```

**4. Initialize the database**
```bash
docker exec papermarket-api npx prisma db push \
  --schema /app/apps/api/prisma/schema.prisma --accept-data-loss

docker exec papermarket-api node prisma/seed.js
```

**5. Open** `http://localhost:3000`

---

### Environment Variables

| Variable | Description |
|:--|:--|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `GOOGLE_CALLBACK_URL` | Absolute URL for the OAuth callback route |
| `FRONTEND_URL` | Frontend origin (used for CORS and redirects) |
| `ADMIN_EMAIL` | Email address for the admin account |
| `ADMIN_PASSWORD` | Password for the admin account |
| `POLYMARKET_SYNC_ENABLED` | Set to `true` to enable automatic market sync |

---

### How Payouts Work

When you buy YES at 34¢ you receive shares priced at that probability. If the market resolves YES, your payout is calculated from your average entry price — not the price at resolution. Early bettors are rewarded for conviction.

---

<div align="center">
<sub>Data sourced from <a href="https://polymarket.com">Polymarket</a></sub>
</div>
