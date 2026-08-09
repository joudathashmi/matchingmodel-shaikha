# Production deployment

## Target topology

| Service | Runtime | Notes |
|---------|---------|--------|
| PostgreSQL | Managed or VM | Primary store for Company, Opportunity, MatchingOutput |
| API | Node 18+ | `opportunity_matching_backend` on port 4000 (or reverse-proxied) |
| Web | Static SPA | `opportunity_matcher_frontend/build` behind nginx / CDN |
| Matching jobs | Python 3.11+ | Batch / cron on a worker with DB + Azure OpenAI access |

Put TLS termination on a reverse proxy (nginx, ALB, Azure App Gateway). Do not expose Postgres publicly.

---

## 1. Environment variables

### Backend (`opportunity_matching_backend/.env`)

| Variable | Production guidance |
|----------|---------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Strong password; URL-encode spaces in DB name |
| `JWT_ACCESS_TOKEN_SECRET` | `openssl rand -hex 64` — unique per environment |
| `JWT_REFRESH_TOKEN_SECRET` | Separate from access secret |
| `CORS_ORIGIN` | Exact frontend origin(s), comma-separated |
| `REFRESH_COOKIE_SECURE` | `true` (HTTPS only) |
| `REFRESH_COOKIE_SAME_SITE` | `lax` (same site) or `none` (cross-site HTTPS) |
| `AZURE_OPENAI_*` | Production Azure resource; rotate if leaked locally |
| `ENABLE_SSO` | `false` until Nafath is fully configured |

Use [`.env.example`](../opportunity_matching_backend/.env.example) as the template.

### Frontend (`opportunity_matcher_frontend/.env`)

| Variable | Production guidance |
|----------|---------------------|
| `REACT_APP_API_BASE_URL` | `https://api.example.com/api` (baked in at **build** time) |

Rebuild after any `REACT_APP_*` change.

### Matching engine (repo root `.env`)

See [`.env.example`](../.env.example). Prefer Azure chat; embeddings may use OpenAI or TF‑IDF fallback.

---

## 2. Database

```bash
cd opportunity_matching_backend
npm ci
npx prisma generate
npx prisma migrate deploy
```

Seed admin/local users only through controlled scripts — never commit seed passwords for production.

Backup schedule: daily logical dump + PITR if available. Test restore quarterly.

---

## 3. Build & run API

```bash
cd opportunity_matching_backend
npm ci
npx prisma generate
npm run build          # if TypeScript build script exists
NODE_ENV=production npm start
```

Process manager example (PM2):

```bash
pm2 start dist/server.js --name matchmaking-api
# or: pm2 start npm --name matchmaking-api -- start
pm2 save
```

Health: hit a lightweight authenticated or public health route behind the proxy; confirm `/api/auth/login` responds.

---

## 4. Build & serve frontend

```bash
cd opportunity_matcher_frontend
npm ci --legacy-peer-deps
npm run build
```

Serve `build/` with nginx:

```nginx
server {
  listen 443 ssl;
  server_name match.example.com;

  root /var/www/matchmaking/build;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

Proxy `/api` to the Node service **or** set `REACT_APP_API_BASE_URL` to the API host (preferred for cookie Path=/ setups).

---

## 5. Matching jobs

On a worker with network access to Postgres + Azure OpenAI:

```bash
source .venv/bin/activate
python3 matching_v3.py --source db --replace-matches
```

Ops rules:

- Schedule rematches off peak; a full run can take tens of minutes.
- Never run `--limit-companies` / `--limit-opportunities` against the live book without a full rematch afterward (`--source db` clears v3 MatchingOutput).
- Persist gate cache (`Output/gate_cache_v3.json`) for cost control; back up with the worker.

On-demand single company:

```bash
python3 on_demand_match_company.py --company-id <id>
```

---

## 6. Post-deploy verification

1. Login with a production officer account.
2. Matching overview / Match Workbench show live tiers.
3. Analytics KPIs match `SELECT count(*) FROM "MatchingOutput"`.
4. Word/PPT export from Analytics downloads without console errors.
5. CORS rejects unknown origins.

---

## 7. Rollback

- API: redeploy previous container/commit; keep Prisma migrations forward-only where possible.
- Frontend: redeploy previous `build/` artifact.
- Matching: restore MatchingOutput from DB backup if a bad rematch shipped.

---

## 8. Monitoring

- API process uptime + 5xx rate
- Postgres connections / slow queries on MatchingOutput
- Azure OpenAI quota / error rate during rematch windows
- Disk for `Output/` gate cache and logs
