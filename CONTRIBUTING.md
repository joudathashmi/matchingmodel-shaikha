# Contributing

## Branches

- `main` — production-ready line for [Matchmakingfinal](https://github.com/joudathashmi/Matchmakingfinal)
- Feature work: short-lived branches, PR into `main`

## Before you commit

1. No `.env` files or secrets.
2. Frontend: `npm run build` (CRACO) succeeds.
3. Backend: TypeScript compiles / `npm run dev` boots against local DB.
4. Matching changes: document scoring / gate behavior in `docs/engine_v3.md` when material.

## Commit style

Prefer short why-focused messages (e.g. “Harden Analytics Office export for CRA” not “update files”).

## Do not

- Commit `node_modules/`, `build/`, `Output/*.log`, Excel dumps, or PPT/DOCX artifacts.
- Run limited `--limit-companies` rematches against a shared production database without restoring a full book afterward.
