# Database schema dumps

## Source (active app DB only)

These dumps are taken from the database the backend actually uses:

- Prisma `SELECT current_database()` → `matchmaking%20F`
- Confirmed tables include `AuditLog`, `MatchComment`, `AppSetting`

Do **not** use dumps from the legacy DB named `matchmaking F` (space).

## Files

- `active_app_schema.sql` — schema-only dump of the active app database
- `latest_schema.sql` — same content (alias)

## Apply on deploy

Prefer migrations:

```bash
cd opportunity_matching_backend
npx prisma migrate deploy
```

Or restore schema-only:

```bash
psql "$DATABASE_URL" -f prisma/dumps/active_app_schema.sql
```
