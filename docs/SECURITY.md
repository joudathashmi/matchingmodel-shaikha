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

## Matching worker

- Worker hosts need DB credentials and Azure OpenAI keys — treat as production secrets.
- Gate cache under `Output/` may contain pair metadata; do not publish the folder.

## Dependency installs

Frontend uses `--legacy-peer-deps` in some environments due to `react-scripts` / TypeScript peer ranges. Pin versions in CI; run `npm audit` before each release and address high/critical findings that affect the runtime surface.
