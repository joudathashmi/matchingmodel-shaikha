#!/usr/bin/env python3
"""Backfill transparency fields on existing MatchingOutput without a full rematch.

Deterministic updates:
  1) Empty recommended_engagement → HOLD / validation fallback text
  2) Weak + score≥0.80 + empty flag → gate_rejected
  3) Potential + score≥0.68 + empty flag → light_gate_cap
  4) Scrub banned hype + company-name openings in strengths/risks/engagement
  5) Recalibrate confidence_score / confidence_label from stored similarities

For full gate re-votes and product-evidence recompute, run matching_v3 or
on-demand company rematch.
"""
from __future__ import annotations

import os
import sys

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 required: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

from matching_v3 import (
    confidence_label,
    confidence_score,
    fallback_engagement,
    polish_narrative,
    _ensure_misa_scope,
)


def connect():
    # Prefer explicit MATCHDB_* knobs. Prisma-style DATABASE_URL often includes
    # ?schema=public which psycopg2 rejects.
    return psycopg2.connect(
        host=os.environ.get("MATCHDB_HOST", "localhost"),
        port=int(os.environ.get("MATCHDB_PORT", "5432")),
        dbname=os.environ.get("MATCHDB_NAME", "matchmaking F"),
        user=os.environ.get("MATCHDB_USER", "postgres"),
        password=os.environ.get("MATCHDB_PASSWORD", "test"),
    )


def main():
    dry = "--dry-run" in sys.argv
    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        """
        SELECT m.id, m.decision_tier, m.final_score, m.evidence_flag,
               m.recommended_engagement, m.value_chain_position,
               m.strengths, m.risks, m.confidence_score, m.confidence_label,
               m.sector_similarity, m.profile_similarity, m.product_similarity,
               c.company_name, o.opportunity_name, o.sector AS opportunity_sector,
               LENGTH(COALESCE(c.company_profile, '')) AS comp_len
        FROM "MatchingOutput" m
        JOIN "Company" c ON c.id = m."companyId"
        JOIN "Opportunity" o ON o.id = m."opportunityId"
        """
    )
    rows = cur.fetchall()
    stats = {
        "engagement": 0,
        "flags": 0,
        "scrub": 0,
        "confidence": 0,
        "misa_scope": 0,
    }

    for r in rows:
        tier = r["decision_tier"] or "Potential Match"
        eng = (r["recommended_engagement"] or "").strip()
        flag = (r["evidence_flag"] or "").strip()
        sector = r.get("opportunity_sector") or ""
        updates = {}

        if not eng:
            updates["recommended_engagement"] = fallback_engagement(
                tier,
                r["company_name"],
                r["opportunity_name"] or "the opportunity",
                sector=sector,
            )
            stats["engagement"] += 1

        score = float(r["final_score"] or 0)
        if tier == "Weak Match" and score >= 0.80 and not flag:
            updates["evidence_flag"] = "gate_rejected"
            flag = "gate_rejected"
            stats["flags"] += 1
        elif tier == "Potential Match" and score >= 0.68 and not flag:
            updates["evidence_flag"] = "light_gate_cap"
            flag = "light_gate_cap"
            stats["flags"] += 1
        elif tier == "Weak Match" and score >= 0.55 and not flag:
            updates["evidence_flag"] = "gate_rejected"
            flag = "gate_rejected"
            stats["flags"] += 1

        polished = polish_narrative(
            {
                "strengths": r["strengths"] or "",
                "risks": r["risks"] or "",
                "recommended_engagement": updates.get(
                    "recommended_engagement", r["recommended_engagement"] or ""
                ),
                "executive_summary": "",
                "value_chain_position": r["value_chain_position"] or "",
                "profile_match_reason": "",
                "product_match_reason": "",
            },
            r["company_name"],
            tier,
            end_product=r["opportunity_name"] or "",
            sector=sector,
        )
        scrubbed = False
        for col in ("strengths", "risks", "recommended_engagement", "value_chain_position"):
            new = polished.get(col, "") or ""
            old = updates.get(col, r.get(col) or "") or ""
            if new != old:
                updates[col] = new
                scrubbed = True
        if scrubbed:
            stats["scrub"] += 1

        eng_final = updates.get(
            "recommended_engagement", r["recommended_engagement"] or ""
        )
        eng_scoped = _ensure_misa_scope(
            eng_final,
            tier,
            r["company_name"],
            r["opportunity_name"] or "the opportunity",
            sector=sector,
        )
        if eng_scoped != (eng_final or ""):
            updates["recommended_engagement"] = eng_scoped
            stats["misa_scope"] += 1

        # Confidence recalibration from stored signals
        gate = (
            "No"
            if "gate_rejected" in flag
            else (
                "Yes"
                if tier in ("Excellent Match", "Strong Match", "Good Match")
                else ""
            )
        )
        light = "light_gate_cap" in flag or "ungated_cap" in flag
        prod = float(r["product_similarity"] or 0)
        ev_level = 2 if prod >= 0.90 else 1 if prod >= 0.70 else 0
        evq = min(
            1.0,
            0.35 + 0.4 * prod + 0.25 * float(r["profile_similarity"] or 0),
        )
        g = gate or ("Partial" if tier == "Potential Match" else "No")
        c = confidence_score(
            int(r["comp_len"] or 0),
            1500,
            0.6,
            [
                float(r["sector_similarity"] or 0),
                float(r["profile_similarity"] or 0),
                prod,
                0.4,
                0.4,
            ],
            "3/3" if g in ("Yes", "Partial") and not light else ("1/1" if light else "0/3"),
            sector_sim=float(r["sector_similarity"] or 0),
            evidence_quality=evq,
            exact_product=prod >= 0.90,
            ev_level=ev_level,
            gate=g,
            light=light,
        )
        label = confidence_label(c)
        if r["confidence_score"] != c or (r["confidence_label"] or "") != label:
            updates["confidence_score"] = c
            updates["confidence_label"] = label
            stats["confidence"] += 1

        if not updates or dry:
            continue
        sets = ", ".join(f"{k} = %s" for k in updates)
        cur.execute(
            f'UPDATE "MatchingOutput" SET {sets} WHERE id = %s',
            (*updates.values(), r["id"]),
        )

    if dry:
        print(f"DRY RUN scanned {len(rows)}: {stats}")
    else:
        conn.commit()
        print(f"Updated {len(rows)} scanned rows: {stats}")
        print("Coverage still needs rematch/enrichment of cold companies.")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
