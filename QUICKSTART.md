# PaperMarket — Quick Start Guide

## 🎯 Start in 5 Minutes

### Prerequisites
- Docker & Docker Compose installed
- That's it!

### 1. Start the Stack

```bash
cd C:/Users/ndemo/papermarket
docker compose up
```

Wait for all services to be healthy:
```
✅ postgres_1 - ready
✅ api_1 - http://localhost:8080/health
✅ web_1 - http://localhost:3000
```

### 2. Open the App

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8080 (health endpoint)

### 3. Create Account

1. Click "Sign Up"
2. Enter username, email, password
3. You get $1,000 in paper money!

### 4. Trade

1. Go to "Markets"
2. Click a market (e.g., "Will Bitcoin reach $100k?")
3. Choose YES/NO
4. Enter amount ($100, $500, etc.)
5. Click "Place Trade"
6. Check your position in "Portfolio"

### 5. Compete

- View "Leaderboard" to see top traders
- Your P&L updates after each trade
- Trade more to climb the ranks

---

## 🔧 Manual Setup (No Docker)

```bash
# 1. Install dependencies
npm install

# 2. Setup database (Postgres must be running locally)
cp .env.example .env
# Edit .env - set DATABASE_URL to your local Postgres

npx prisma migrate dev
npx prisma db seed

# 3. Start backend (Terminal 1)
cd apps/api
npm run dev

# 4. Start frontend (Terminal 2)
cd apps/web
npm run dev
```

---

## 📱 Key URLs

| Page | URL |
|------|-----|
| Home | http://localhost:3000 |
| Markets | http://localhost:3000/markets |
| Market Detail | http://localhost:3000/markets/{id} |
| Portfolio | http://localhost:3000/portfolio |
| Leaderboard | http://localhost:3000/leaderboard |
| API Health | http://localhost:8080/health |

---

## 👤 Test Accounts

After seeding, you have:

| Username | Email | Password |
|----------|-------|----------|
| admin | admin@papermarket.com | admin123 |
| alice | alice@example.com | password123 |
| bob | bob@example.com | password123 |
| charlie | charlie@example.com | password123 |

(Change admin password in production!)

---

## 🔌 API Examples

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Place Trade
```bash
curl -X POST http://localhost:8080/api/trades \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"marketId":"market-uuid","side":"YES","amount":100}'
```

### Get Leaderboard
```bash
curl http://localhost:8080/api/users/leaderboard
```

---

## 🚀 Deploy to Production

### Fly.io (Easiest)
```bash
fly auth login
fly launch
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"
fly deploy
```

### Railway
1. Connect GitHub repo
2. Railway detects Node.js
3. Postgres auto-added
4. Set env vars
5. Deploy!

### Self-Hosted
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 🐛 Troubleshooting

**Port 3000/8080 already in use?**
```bash
# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Database error?**
```bash
# Reset database
npx prisma migrate reset
npx prisma db seed
```

**API not responding?**
```bash
# Check health
curl http://localhost:8080/health

# Check logs
docker compose logs api
```

**Can't log in?**
- Use test account: alice@example.com / password123
- Or reset database and seed again

---

## 📚 Full Documentation

See `README.md` for:
- Complete API reference
- Database schema details
- Architecture decisions
- Production deployment
- Contributing guidelines

See `IMPLEMENTATION_SUMMARY.md` for:
- What was built
- Feature checklist
- Next steps

---

## 💡 Tips

1. **Use test accounts** — alice, bob, charlie already have balances
2. **Markets auto-sync** — Polymarket data updates every 10 min
3. **Admin features** — Use admin@papermarket.com to create custom markets
4. **Leaderboard updates in real-time** — P&L calculated on every trade
5. **Mobile friendly** — Works on phones with Tailwind responsive design

---

## 🎉 You're Ready!

```bash
docker compose up
# Visit http://localhost:3000
# Create account
# Start trading!
```

Happy trading! 🚀
