# Security notes

## Secrets

Never commit:

- `.env` / `.env.local` / any file with API keys or JWT secrets
- Database dumps
- Production MatchingOutput exports that contain confidential company notes

Templates only: `.env.example` files (placeholders, no real keys).

If a key was ever stored in a local `.env` that may have been shared, **rotate it** in Azure / OpenAI / Postgres before production go-live.

## Auth

- Access tokens are short-lived JWTs; refresh tokens live in HTTP-only cookies.
- Production: `REFRESH_COOKIE_SECURE=true`, HTTPS only.
- Restrict `CORS_ORIGIN` to known frontend hosts.
- Disable SSO (`ENABLE_SSO=false`) until Nafath integration is fully hardened.
- Login is rate-limited (20 / 15 min); forgot-password (5 / hour); reset-password (10 / hour).
- Password-reset tokens are never written to logs. Dev-only link reveal requires `PASSWORD_RESET_DEV_RETURN_LINK=true` and non-production `NODE_ENV`.
- Do not publish seed or README passwords. Bootstrap local users via Prisma seed only.

## Database scripts

- Python loaders (`load_to_db_v3.py`, audit/backfill) require `MATCHDB_PASSWORD` or `DATABASE_URL` via `db_env.py` — no default password.
- Prefer least-privilege DB roles (read-only for audit; scoped write for loaders).

## Matching worker

- Worker hosts need DB credentials and Azure OpenAI keys — treat as production secrets.
- Gate cache under `Output/` may contain pair metadata; do not publish the folder.

## Dependency installs

Frontend uses `--legacy-peer-deps` in some environments due to `react-scripts` / TypeScript peer ranges. Pin versions in CI; run `npm audit` before each release and address high/critical findings that affect the runtime surface.
