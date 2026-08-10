# Database schema dumps

## Important: two local DB names existed historically

| Database name | Notes |
|---|---|
| `matchmaking%20F` (literal `%20`) | **Active app DB** (`DATABASE_URL`). Has latest models. |
| `matchmaking F` (space) | Legacy / accidental name. Was missing newer tables until 2026-08-10 sync. |

Always dump from the DB Prisma reports via `SELECT current_database();`.

## Latest schema-only dump

- `latest_schema.sql` — schema from the active app database

Apply migrations instead when possible:

```bash
cd opportunity_matching_backend
npx prisma migrate deploy
```
