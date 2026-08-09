# MISA Investor Attraction — Opportunity Matchmaking

Production monorepo for the **Ministry of Investment (MISA)** company–opportunity matching platform:

| Layer | Path | Role |
|-------|------|------|
| Matching engine | `matching_v3.py` (+ helpers) | Score, gate, narrate, load `MatchingOutput` |
| Backend API | `opportunity_matching_backend/` | Express + Prisma + JWT auth + analytics |
| Frontend portal | `opportunity_matcher_frontend/` | Officer UI (Match Workbench, Analytics, Explore) |

GitHub: [joudathashmi/Matchmakingfinal](https://github.com/joudathashmi/Matchmakingfinal)

---

## Architecture

```
Companies + Opportunities (PostgreSQL)
            │
            ▼
   matching_v3.py  ──► MatchingOutput (tiers, scores, strengths/risks, engagement)
            │
            ▼
   Backend API :4000  ──► Frontend :3000 (or static CDN)
```

- **Engine** scores the full company × opportunity matrix, shortlists top‑N per opportunity, runs a GPT gate, writes MISA-scoped narratives, upserts Postgres.
- **Backend** serves live MatchingOutput metrics (Analytics), Match Case, Pursuit, auth.
- **Frontend** is the officer desk (no Azure branding in UI).

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 14+ with the matchmaking schema (Prisma)
- Azure OpenAI (chat) and optionally OpenAI embeddings

---

## Quick start (local development)

### 1. Database

Create a Postgres database (example name `matchmaking F`) and apply Prisma migrations from the backend:

```bash
cd opportunity_matching_backend
cp .env.example .env
# edit DATABASE_URL, JWT secrets, Azure keys
npm install
npx prisma migrate deploy   # or: npx prisma db push
npx prisma generate
```

### 2. Backend

```bash
cd opportunity_matching_backend
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd opportunity_matcher_frontend
cp .env.example .env
# REACT_APP_API_BASE_URL=http://localhost:4000/api
npm install --legacy-peer-deps
npm start                   # http://localhost:3000  (uses CRACO)
```

Local accounts come from the backend seed (`cd opportunity_matching_backend && npx prisma db seed`). Use only on isolated development machines; never reuse seed passwords in staging or production.

### 4. Matching engine (optional rematch)

```bash
cd ..   # SSDAMMModel3 root
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set Azure OpenAI (+ optional OPENAI_API_KEY for embeddings)

python3 matching_v3.py --source db --replace-matches
```

`--source db` loads from Postgres and **clears/replaces** v3 MatchingOutput rows. Do not use small `--limit-*` smokes against a production book without a full follow-up run.

Details: [docs/engine_v3.md](docs/engine_v3.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Production checklist

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for full steps. Minimum:

1. Generate new JWT secrets (`openssl rand -hex 64`).
2. Set production `DATABASE_URL`, `CORS_ORIGIN`, `REFRESH_COOKIE_SECURE=true`.
3. Point frontend `REACT_APP_API_BASE_URL` at the public API.
4. Build frontend (`npm run build`) and serve `build/` behind HTTPS.
5. Run backend with `NODE_ENV=production` (PM2, systemd, or container).
6. Keep `.env` files off git; use a secrets manager in the host environment.
7. Rotate any keys that were ever used in local `.env` files.

---

## Documentation map

| Doc | Contents |
|-----|----------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deploy, env vars, ops |
| [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) | Day-to-day local workflow |
| [docs/engine_v3.md](docs/engine_v3.md) | Matching methodology v3 |
| [docs/matching_v2.md](docs/matching_v2.md) | Legacy v2 engine notes |
| [docs/API_OVERVIEW.md](docs/API_OVERVIEW.md) | Backend surface for officers / UI |
| [docs/SECURITY.md](docs/SECURITY.md) | Secrets, auth, CORS |
| [docs/launch_roadmap.md](docs/launch_roadmap.md) | Product roadmap notes |

---

## Repository layout

```
SSDAMMModel3/
  matching_v3.py                 # Primary matching engine
  on_demand_match_company.py     # Single-company rematch
  load_to_db_v3.py               # DB load helpers
  audit_matching_quality.py      # Quality scorecard
  backfill_match_transparency.py # Narrative / flag polish
  opportunity_matching_backend/  # Express + Prisma API
  opportunity_matcher_frontend/  # React (CRA + CRACO) portal
  docs/                          # Operations & engine docs
  Output/                        # Generated artifacts (gitignored)
```

---

## Analytics exports

Analytics supports PNG/PDF snapshots and **Word / PowerPoint** files with native Office charts (Chart Design → Edit Data). PowerPoint uses `pptxgenjs` via CRACO webpack stubs for Node builtins.

---

## License / ownership

Internal MISA / Investor Attraction tooling. Do not publish secrets or production database dumps.
