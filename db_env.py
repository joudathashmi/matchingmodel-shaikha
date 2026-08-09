"""Shared Postgres connection helpers for matching scripts.

Fail closed: MATCHDB_PASSWORD (or DATABASE_URL) must be set explicitly.
Never default to a known password.
"""
from __future__ import annotations

import os
from typing import Any, Dict

import psycopg2


def require_matchdb_password() -> str:
    password = os.environ.get("MATCHDB_PASSWORD")
    if not password:
        raise SystemExit(
            "MATCHDB_PASSWORD is required. Set it in .env (see .env.example). "
            "There is no default password."
        )
    return password


def matchdb_kwargs() -> Dict[str, Any]:
    return {
        "host": os.environ.get("MATCHDB_HOST", "localhost"),
        "port": int(os.environ.get("MATCHDB_PORT", "5432")),
        "dbname": os.environ.get("MATCHDB_NAME", "matchmaking F"),
        "user": os.environ.get("MATCHDB_USER", "postgres"),
        "password": require_matchdb_password(),
    }


def connect_matchdb():
    """Connect via DATABASE_URL when set, otherwise MATCHDB_* knobs."""
    url = os.environ.get("DATABASE_URL")
    if url:
        # Prisma URLs may append ?schema=public — strip query for psycopg2.
        clean = url.split("?", 1)[0]
        return psycopg2.connect(clean)
    return psycopg2.connect(**matchdb_kwargs())
