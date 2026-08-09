# Local development

## Ports

| Service | Port |
|---------|------|
| Frontend (CRA + CRACO) | 3000 |
| Backend API | 4000 |
| PostgreSQL | 5432 |

If `npm start` claims port 4000 is busy, force the frontend port:

```bash
PORT=3000 BROWSER=none npm start
```

## Frontend notes

- Scripts use **CRACO** (`craco start` / `craco build`) so `pptxgenjs` Node imports (`node:fs`) are stubbed for the browser.
- Install with `npm install --legacy-peer-deps` if peer conflicts appear with `react-scripts` / TypeScript.
- Copy `.env.example` → `.env`. Do not commit `.env`.

## Backend notes

- Dev server: `npm run dev` (ts-node-dev).
- After Prisma schema changes: `npx prisma generate` and migrate/push.
- Analytics reads live MatchingOutput — rematch or seed data before expecting charts.

## Matching engine notes

```bash
# Full DB rematch (replaces v3 MatchingOutput)
python3 matching_v3.py --source db --replace-matches

# Quality scorecard
python3 audit_matching_quality.py

# Polish narratives / confidence / MISA scope without full rematch
python3 backfill_match_transparency.py
```

Prefer `MATCHDB_*` env vars over Prisma-style `DATABASE_URL` for Python scripts (`?schema=public` breaks psycopg2).

## Nested Git history (optional)

If you previously had separate GitLab remotes for FE/BE, nested `.git` folders were moved to:

`../.git-nested-backup/{frontend,backend}.git`

Restore only if you need to push those remotes independently again.
