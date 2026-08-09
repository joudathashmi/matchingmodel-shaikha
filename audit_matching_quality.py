#!/usr/bin/env python3
"""Offline matching quality eval pack.

Measures the live MatchingOutput book against world-class officer bars:
  - pursue coverage / cold book
  - score vs tier inversions
  - confidence discrimination
  - explanation fill + narrative hygiene
  - demotion flag transparency

Usage:
  python3 audit_matching_quality.py
  python3 audit_matching_quality.py --json Output/matching_quality_eval.json
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 required: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

HYPE = re.compile(
    r"\b(leveraging|leverage|aligns well|well-positioned|proven track record|"
    r"extensive experience|strong partner|reliable supplier|expertise in|facilitate)\b",
    re.I,
)

PURSUE = ("Excellent Match", "Strong Match", "Good Match")


def connect():
    from db_env import connect_matchdb

    return connect_matchdb()


def pct(n, d):
    return round(1000 * n / d) / 10 if d else 0.0


def fetch_all(cur, sql):
    cur.execute(sql)
    return cur.fetchall()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default="Output/matching_quality_eval.json")
    args = ap.parse_args()

    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    companies = fetch_all(cur, 'SELECT COUNT(*)::int AS n FROM "Company"')[0]["n"]
    opps = fetch_all(cur, 'SELECT COUNT(*)::int AS n FROM "Opportunity"')[0]["n"]
    total = fetch_all(cur, 'SELECT COUNT(*)::int AS n FROM "MatchingOutput"')[0]["n"]

    tiers = fetch_all(
        cur,
        """
        SELECT decision_tier AS tier, COUNT(*)::int AS n,
               ROUND(AVG(final_score)::numeric, 3) AS avg_score
        FROM "MatchingOutput" GROUP BY 1 ORDER BY n DESC
        """,
    )
    conf = fetch_all(
        cur,
        """
        SELECT confidence_label AS label, COUNT(*)::int AS n
        FROM "MatchingOutput" GROUP BY 1 ORDER BY n DESC
        """,
    )
    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE decision_tier IN ('Excellent Match','Strong Match','Good Match')
        """
    )
    pursue_n = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(DISTINCT "companyId")::int AS n FROM "MatchingOutput"
        WHERE decision_tier IN ('Excellent Match','Strong Match','Good Match')
        """
    )
    pursue_companies = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE decision_tier = 'Weak Match' AND final_score >= 0.80
        """
    )
    weak_high = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE decision_tier = 'Weak Match' AND final_score >= 0.80
          AND (evidence_flag IS NULL OR TRIM(evidence_flag) = '')
        """
    )
    weak_high_unflagged = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE confidence_label ILIKE 'Low'
        """
    )
    low_n = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE recommended_engagement IS NOT NULL AND TRIM(recommended_engagement) <> ''
        """
    )
    with_engage = cur.fetchone()["n"]

    cur.execute(
        """
        SELECT COUNT(*)::int AS n FROM "MatchingOutput"
        WHERE evidence_flag IS NOT NULL AND TRIM(evidence_flag) <> ''
        """
    )
    with_flags = cur.fetchone()["n"]

    # Narrative hygiene on top 400
    cur.execute(
        """
        SELECT strengths, risks, recommended_engagement, c.company_name
        FROM "MatchingOutput" m
        JOIN "Company" c ON c.id = m."companyId"
        ORDER BY final_score DESC NULLS LAST
        LIMIT 400
        """
    )
    top = cur.fetchall()
    hype = 0
    open_co = 0
    for r in top:
        blob = " ".join(
            [
                r.get("strengths") or "",
                r.get("risks") or "",
                r.get("recommended_engagement") or "",
            ]
        )
        if HYPE.search(blob):
            hype += 1
        s = (r.get("strengths") or "").strip().lower()
        name = (r.get("company_name") or "").strip().lower()
        if name and s.startswith(name):
            open_co += 1
        elif s.startswith("the company"):
            open_co += 1

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "universe": {
            "companies": companies,
            "opportunities": opps,
            "matches": total,
            "pursue": pursue_n,
            "pursueYieldPct": pct(pursue_n, total),
            "companyPursueCoveragePct": pct(pursue_companies, companies),
            "coldCompanies": companies - pursue_companies,
        },
        "tiers": [dict(t) for t in tiers],
        "confidence": [dict(c) for c in conf],
        "calibration": {
            "weakScoreGe80": weak_high,
            "weakScoreGe80Unflagged": weak_high_unflagged,
            "lowConfidence": low_n,
            "engagementFillPct": pct(with_engage, total),
            "evidenceFlagFillPct": pct(with_flags, total),
        },
        "narrativeTop400": {
            "hypePct": pct(hype, len(top) or 1),
            "opensWithCompanyPct": pct(open_co, len(top) or 1),
        },
        "bars": {
            "worldClass": {
                "companyPursueCoveragePct_min": 25.0,
                "lowConfidenceSharePct_min": 8.0,
                "weakHighUnflagged_max": 20,
                "engagementFillPct_min": 95.0,
                "evidenceFlagFillPct_min": 60.0,
                "hypePct_max": 5.0,
                "opensWithCompanyPct_max": 15.0,
            }
        },
    }

    bars = report["bars"]["worldClass"]
    u = report["universe"]
    cal = report["calibration"]
    nar = report["narrativeTop400"]
    checks = [
        ("companyPursueCoveragePct", u["companyPursueCoveragePct"] >= bars["companyPursueCoveragePct_min"],
         u["companyPursueCoveragePct"], bars["companyPursueCoveragePct_min"]),
        ("lowConfidenceShare", pct(low_n, total) >= bars["lowConfidenceSharePct_min"],
         pct(low_n, total), bars["lowConfidenceSharePct_min"]),
        ("weakHighUnflagged", weak_high_unflagged <= bars["weakHighUnflagged_max"],
         weak_high_unflagged, bars["weakHighUnflagged_max"]),
        ("engagementFillPct", cal["engagementFillPct"] >= bars["engagementFillPct_min"],
         cal["engagementFillPct"], bars["engagementFillPct_min"]),
        ("evidenceFlagFillPct", cal["evidenceFlagFillPct"] >= bars["evidenceFlagFillPct_min"],
         cal["evidenceFlagFillPct"], bars["evidenceFlagFillPct_min"]),
        ("hypePct", nar["hypePct"] <= bars["hypePct_max"],
         nar["hypePct"], bars["hypePct_max"]),
        ("opensWithCompanyPct", nar["opensWithCompanyPct"] <= bars["opensWithCompanyPct_max"],
         nar["opensWithCompanyPct"], bars["opensWithCompanyPct_max"]),
    ]
    report["passFail"] = [
        {
            "check": name,
            "pass": ok,
            "actual": actual,
            "bar": bar,
        }
        for name, ok, actual, bar in checks
    ]
    report["scorecard"] = {
        "passed": sum(1 for c in report["passFail"] if c["pass"]),
        "total": len(report["passFail"]),
    }

    os.makedirs(os.path.dirname(args.json) or ".", exist_ok=True)
    with open(args.json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"Wrote {args.json}")
    print(
        f"Scorecard: {report['scorecard']['passed']}/{report['scorecard']['total']} "
        "world-class bars passed"
    )
    for c in report["passFail"]:
        mark = "PASS" if c["pass"] else "FAIL"
        print(f"  [{mark}] {c['check']}: actual={c['actual']} bar={c['bar']}")

    cur.close()
    conn.close()
    # Non-zero exit if failing bars (CI-friendly)
    sys.exit(0 if report["scorecard"]["passed"] == report["scorecard"]["total"] else 2)


if __name__ == "__main__":
    main()
