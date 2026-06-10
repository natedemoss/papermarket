# Hosting for $0/month

Railway was billing for an always-on service plus Postgres. This setup replaces it with free tiers that hold up fine at PaperMarket's scale:

| Piece | Service | Cost | Notes |
|---|---|---|---|
| Frontend | Vercel (unchanged) | $0 | already deployed |
| API | Render free web service | $0 | 750 instance-hours/mo, sleeps after 15 min idle |
| Postgres | Neon free tier | $0 | 0.5 GB, never expires, auto-suspends when idle |
| Keep-alive + sync | cron-job.org | $0 | pings the API every 10 min so it never cold-starts |

Why not the obvious alternatives:
- **Render's own free Postgres** expires after 30 days. Neon's doesn't.
- **Fly.io** killed its free tier; a small app realistically lands at $8+/mo.
- **Railway** free credit is $1/mo now, which is hours of uptime, not a month.

## 1. Database: Neon

1. Sign up at [neon.tech](https://neon.tech) (GitHub login works), create a project named `papermarket`.
2. Copy the connection string (the pooled one is fine), it looks like
   `postgresql://USER:PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require`.
3. That's it. The schema gets created on first deploy by `prisma db push` in the start command.

## 2. API: Render

1. Sign up at [render.com](https://render.com), click **New → Blueprint**, point it at this repo. It reads `render.yaml` and sets up the `papermarket-api` service on the free plan.
2. In the service's **Environment** tab, fill in the values marked `sync: false`:
   - `DATABASE_URL` — the Neon string from step 1
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — pick real values, the defaults are public in this repo
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — only if Google OAuth should work; also add the new Render URL as an authorized redirect in the Google Cloud console
3. Deploy. The service URL will be something like `https://papermarket-api.onrender.com`.
4. Sanity check: `https://papermarket-api.onrender.com/health` should return `{"status":"ok"}`.

## 3. Point Vercel at the new API

In the Vercel project settings, set `VITE_API_URL` to `https://papermarket-api.onrender.com/api` and redeploy the frontend.

Update the README badge URL (it still points at `papermarket-production.up.railway.app`).

## 4. Keep-alive: cron-job.org

Render free services sleep after 15 minutes without traffic and take ~50s to wake. A free ping every 10 minutes prevents that, and it also keeps the in-process node-cron Polymarket sync running (the sync only fires while the process is awake).

1. Sign up at [cron-job.org](https://cron-job.org) (free).
2. Create a job: URL `https://papermarket-api.onrender.com/health`, schedule **every 10 minutes**.

Math check: one service running 24/7 is ~720 instance-hours/month, under Render's 750 free hours.

## Costs and limits to watch

- Neon free is 0.5 GB storage and 100 compute-hours/mo. The compute hours are plenty because Neon suspends between queries; storage is the one to watch if markets/trades tables grow. Old resolved markets can be pruned if it fills.
- Render free has no SLA and one concurrent build. Fine here.
- If the project outgrows this, the cheapest paid step up is Render Starter ($7/mo, no sleeping) and staying on Neon free.
