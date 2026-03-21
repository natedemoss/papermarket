# Deployment Checklist

## Pre-Deployment (Every Time)

- [ ] All tests pass
- [ ] Code is committed to git
- [ ] `.env` is configured with production values
- [ ] Database migrations are up-to-date
- [ ] No console.log or debug code left in production files

## Environment Variables

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — Generated with `openssl rand -hex 32`
- [ ] `JWT_REFRESH_SECRET` — Generated with `openssl rand -hex 32`
- [ ] `DATABASE_URL` — Production database with strong password
- [ ] `FRONTEND_URL` — Your domain (e.g., https://papermarket.com)
- [ ] `ADMIN_PASSWORD` — Changed from default
- [ ] `POLYMARKET_SYNC_ENABLED=true`
- [ ] `POLYMARKET_SYNC_LIMIT=50`

## Database

- [ ] PostgreSQL 14+ running with strong credentials
- [ ] Backups enabled and tested
- [ ] Connection pooling configured
- [ ] SSL/TLS enforced for connections
- [ ] `npx prisma migrate deploy` executed
- [ ] `npx prisma db seed` executed (or at least one admin created)

## Security

- [ ] SSL/TLS certificates installed (or use Let's Encrypt)
- [ ] Helmet security headers enabled (✅ in code)
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting configured (✅ in code)
- [ ] Admin account password changed
- [ ] Input validation on all endpoints (✅ Zod)
- [ ] No sensitive data in logs
- [ ] Database credentials not in code (using env vars)

## Backend

- [ ] `npm run build` succeeds with no errors
- [ ] TypeScript strict mode passes
- [ ] All imports resolve correctly
- [ ] `npx prisma generate` executed
- [ ] Cron job starts automatically
- [ ] Health check endpoint responds: `/health`
- [ ] All services start with `npm start` or Docker

## Frontend

- [ ] `npm run build` succeeds
- [ ] Build output (dist/) is < 1MB
- [ ] No console errors in browser
- [ ] localStorage used correctly for tokens
- [ ] API_URL is set to production backend
- [ ] All routes are accessible
- [ ] Responsive design tested on mobile

## Docker (If Using)

- [ ] Docker images build successfully
- [ ] `docker compose up` starts all services
- [ ] Postgres migrations run automatically
- [ ] Health checks pass
- [ ] Logs are clean (no errors)

## Deployment Platform

### Fly.io
- [ ] Fly CLI installed and authenticated
- [ ] App created: `fly launch`
- [ ] Secrets set: `fly secrets set ...`
- [ ] Database provisioned
- [ ] Deploy succeeds: `fly deploy`
- [ ] Health checks pass: `fly status`

### Railway
- [ ] GitHub repo connected
- [ ] Environment variables configured
- [ ] Postgres plugin added
- [ ] Deploy triggered
- [ ] Logs show successful startup

### Self-Hosted
- [ ] Server running (Ubuntu 20.04+ recommended)
- [ ] Docker/Docker Compose installed
- [ ] SSL certificates installed
- [ ] Nginx configured and reloading
- [ ] Database backups automated
- [ ] Monitoring/alerting set up

## Post-Deployment

- [ ] Visit frontend URL — page loads
- [ ] Register new account — succeeds
- [ ] Login — token obtained and stored
- [ ] View markets — markets load
- [ ] Place trade — executes successfully
- [ ] Portfolio updates — shows new position
- [ ] Leaderboard updates — shows user
- [ ] API health check — responds 200
- [ ] Logs are clean — no errors

## Monitoring

- [ ] Database connection pool healthy
- [ ] CPU/memory usage normal
- [ ] Disk space available
- [ ] Network latency acceptable
- [ ] Error rate < 1%
- [ ] Response times < 500ms

## Rollback Plan

If deployment fails:

1. **Keep previous version tagged in git**
2. **Database:** Restore from backup if migrations fail
3. **API:** Redeploy previous image
4. **Frontend:** Redeploy previous build
5. **Notify users:** Brief message on status page

## Ongoing Maintenance

- [ ] **Daily:** Monitor logs and errors
- [ ] **Weekly:** Check database size and backups
- [ ] **Monthly:** Review security updates
- [ ] **Quarterly:** Update dependencies
- [ ] **Annually:** Security audit

## Feature Flags (Optional)

Consider adding for safer deployments:

```env
FEATURE_NEW_TRADING_UI=false
FEATURE_POLYMARKET_SYNC=true
FEATURE_CUSTOM_MARKETS=false
```

## Notes

```
[Deployment date, issues encountered, resolution]
[Date, Status, Notes]
```

---

**Deployment by:** ___________________
**Date:** ___________________
**Status:** ☐ Pending ☐ In Progress ☐ Complete ☐ Failed
