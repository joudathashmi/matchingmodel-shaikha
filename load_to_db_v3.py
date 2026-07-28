#!/usr/bin/env python3
"""Load Output/matching_output_v3.csv into the local "matchmaking F" Postgres
database (Prisma-managed app schema).

The app's MatchingOutput table references Company and Opportunity by integer
foreign keys, and none of this project's 61 companies / 12 opportunities exist
in the app universe, so the loader:

  1. inserts missing companies (exact company_name match only - no fuzzy
     attach, so e.g. our "Belden" is NOT merged into the app's
     "Belden (Opterna)" subsidiary) with profile fields from Data/companies.xlsx;
  2. inserts missing opportunities with fields from Data/new_opportunities.xlsx;
  3. upserts match rows on the (companyId, opportunityId) unique constraint.

Legacy columns are populated with a lossy mapping (documented inline); the
full-fidelity v3 fields go to the columns added on 2026-07-28. Every row this
loader touches carries model_version='v3' so it can be audited or deleted:

    DELETE FROM "MatchingOutput" WHERE model_version = 'v3';
"""

import csv
import json
import math
import os
import re
import sys
from datetime import datetime, timezone

import pandas as pd
import psycopg2

DB = dict(
    dbname=os.environ.get("MATCHDB_NAME", "matchmaking F"),
    user=os.environ.get("MATCHDB_USER", "postgres"),
    password=os.environ.get("MATCHDB_PASSWORD", "test"),
    host=os.environ.get("MATCHDB_HOST", "localhost"),
    port=int(os.environ.get("MATCHDB_PORT", "5432")),
)

CSV_PATH = "Output/matching_output_v3.csv"
COMPANIES_XLSX = "Data/companies.xlsx"
OPPORTUNITIES_XLSX = "Data/new_opportunities.xlsx"
HUMAN_REVIEWS = "Data/human_reviews.csv"
MODEL_VERSION = "v3"

# Vetted tiers map to the app's legacy binary decision.
YES_TIERS = {"Excellent Match", "Strong Match", "Good Match"}


def _s(v):
    """NaN/None-safe string, None when empty."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    s = str(v).strip()
    return s or None


def parse_confidence(v):
    """'91 (High)' -> (91, 'High')."""
    m = re.match(r"\s*(\d+)\s*\((\w+)\)", str(v))
    return (int(m.group(1)), m.group(2)) if m else (None, None)


def load_company_source():
    df = pd.read_excel(COMPANIES_XLSX)
    df = df.rename(columns={
        "Company Name": "company_name", "Company Profile": "company_profile",
        "Product/Services": "product_services",
    })
    return {str(r["company_name"]).strip(): r for _, r in df.iterrows()}


def load_opportunity_source():
    df = pd.read_excel(OPPORTUNITIES_XLSX)
    return {str(r["What is the opportunity name?"]).strip(): r for _, r in df.iterrows()}


def load_human_verdicts():
    out = {}
    try:
        with open(HUMAN_REVIEWS) as fh:
            for row in csv.DictReader(fh):
                out[(row["company"].strip(), row["opportunity"].strip())] = \
                    row["verdict"].strip().capitalize()  # agree -> Agree
    except FileNotFoundError:
        pass
    return out


def ensure_company(cur, name, src_rows, created):
    cur.execute('SELECT id FROM "Company" WHERE company_name = %s', (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    src = src_rows.get(name)
    cur.execute(
        'INSERT INTO "Company" (company_name, company_sector, company_profile, '
        'product_services) VALUES (%s, %s, %s, %s) RETURNING id',
        (name,
         _s(src.get("Sector")) if src is not None else None,
         _s(src.get("company_profile")) if src is not None else None,
         _s(src.get("product_services")) if src is not None else None))
    created.append(name)
    return cur.fetchone()[0]


def ensure_opportunity(cur, name, src_rows, created):
    cur.execute('SELECT id FROM "Opportunity" WHERE opportunity_name = %s', (name,))
    row = cur.fetchone()
    if row:
        return row[0]
    src = src_rows.get(name)
    g = (lambda k: _s(src.get(k))) if src is not None else (lambda k: None)
    cur.execute(
        'INSERT INTO "Opportunity" (opportunity_name, sector, opportunity_description, '
        'investment_highlights, value_proposition, key_demand_drivers, key_players, '
        'materials_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
        (name, g("Sector"), g("What is the opportunity description?"),
         g("What are the investment highlights?"),
         g("What is the value proposition of this opportunity?"),
         g("What are the key demand drivers?"),
         g("Who are the key players in this sector or project?"),
         g("What materials are involved or required in the project?")))
    created.append(name)
    return cur.fetchone()[0]


UPSERT = '''
INSERT INTO "MatchingOutput" (
    "companyId", "opportunityId", company_name, opportunity_name,
    company_sector, opportunity_sector,
    sector_similarity, profile_similarity, product_similarity,
    ai_score, ai_decision, final_score, ai_explanation, rank,
    ai_insight, suggested_plan, match_reason,
    decision_tier, confidence_score, confidence_label, evidence_flag,
    corporate_group, business_model, value_chain_role, value_chain_position,
    value_chain_score, match_type, opportunity_status, strengths, risks,
    recommended_engagement, suggested_localization_model, human_verdict,
    model_version, matched_at)
VALUES (%(companyId)s, %(opportunityId)s, %(company_name)s, %(opportunity_name)s,
    %(company_sector)s, %(opportunity_sector)s,
    %(sector_similarity)s, %(profile_similarity)s, %(product_similarity)s,
    %(ai_score)s, %(ai_decision)s, %(final_score)s, %(ai_explanation)s, %(rank)s,
    %(ai_insight)s, %(suggested_plan)s, %(match_reason)s,
    %(decision_tier)s, %(confidence_score)s, %(confidence_label)s, %(evidence_flag)s,
    %(corporate_group)s, %(business_model)s, %(value_chain_role)s, %(value_chain_position)s,
    %(value_chain_score)s, %(match_type)s, %(opportunity_status)s, %(strengths)s, %(risks)s,
    %(recommended_engagement)s, %(suggested_localization_model)s, %(human_verdict)s,
    %(model_version)s, %(matched_at)s)
ON CONFLICT ("companyId", "opportunityId") DO UPDATE SET
    company_name = EXCLUDED.company_name,
    opportunity_name = EXCLUDED.opportunity_name,
    company_sector = EXCLUDED.company_sector,
    opportunity_sector = EXCLUDED.opportunity_sector,
    sector_similarity = EXCLUDED.sector_similarity,
    profile_similarity = EXCLUDED.profile_similarity,
    product_similarity = EXCLUDED.product_similarity,
    ai_score = EXCLUDED.ai_score,
    ai_decision = EXCLUDED.ai_decision,
    final_score = EXCLUDED.final_score,
    ai_explanation = EXCLUDED.ai_explanation,
    rank = EXCLUDED.rank,
    ai_insight = EXCLUDED.ai_insight,
    suggested_plan = EXCLUDED.suggested_plan,
    match_reason = EXCLUDED.match_reason,
    decision_tier = EXCLUDED.decision_tier,
    confidence_score = EXCLUDED.confidence_score,
    confidence_label = EXCLUDED.confidence_label,
    evidence_flag = EXCLUDED.evidence_flag,
    corporate_group = EXCLUDED.corporate_group,
    business_model = EXCLUDED.business_model,
    value_chain_role = EXCLUDED.value_chain_role,
    value_chain_position = EXCLUDED.value_chain_position,
    value_chain_score = EXCLUDED.value_chain_score,
    match_type = EXCLUDED.match_type,
    opportunity_status = EXCLUDED.opportunity_status,
    strengths = EXCLUDED.strengths,
    risks = EXCLUDED.risks,
    recommended_engagement = EXCLUDED.recommended_engagement,
    suggested_localization_model = EXCLUDED.suggested_localization_model,
    human_verdict = EXCLUDED.human_verdict,
    model_version = EXCLUDED.model_version,
    matched_at = EXCLUDED.matched_at
RETURNING (xmax = 0) AS inserted
'''


def _sync_sequences(cur):
    """The app's tables were bulk-loaded with explicit ids, leaving the
    sequences behind max(id); align them so inserts cannot collide."""
    for table in ("MatchingOutput", "Company", "Opportunity"):
        cur.execute(
            f'SELECT setval(\'"{table}_id_seq"\', '
            f'(SELECT COALESCE(MAX(id), 1) FROM "{table}"))')


def load_csv(csv_path: str = CSV_PATH) -> dict:
    """Upsert a matching_v3 output CSV into the database. Returns stats."""
    df = pd.read_csv(csv_path)
    comp_src = load_company_source()
    opp_src = load_opportunity_source()
    human = load_human_verdicts()
    now = datetime.now(timezone.utc)

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    new_companies, new_opps = [], []
    comp_ids, opp_ids = {}, {}
    inserted = updated = 0

    try:
        _sync_sequences(cur)
        for _, r in df.iterrows():
            cname = str(r["company_name"]).strip()
            oname = str(r["opportunity_name"]).strip()
            if cname not in comp_ids:
                comp_ids[cname] = ensure_company(cur, cname, comp_src, new_companies)
            if oname not in opp_ids:
                opp_ids[oname] = ensure_opportunity(cur, oname, opp_src, new_opps)

            conf_num, conf_label = parse_confidence(r["confidence_score"])
            plan = [p for p in (_s(r.get("recommended_engagement")),
                                _s(r.get("suggested_localization_model"))) if p]
            params = dict(
                companyId=comp_ids[cname],
                opportunityId=opp_ids[oname],
                company_name=cname,
                opportunity_name=oname,
                company_sector=_s(r.get("company_sector")),
                opportunity_sector=_s(r.get("opportunity_sector")),
                sector_similarity=float(r["sector_similarity"]),
                profile_similarity=float(r["profile_similarity"]),
                product_similarity=float(r["product_similarity"]),
                ai_score=float(r["ai_score"]),
                # lossy legacy mapping: vetted tiers (Good+) -> Yes
                ai_decision="Yes" if r["decision"] in YES_TIERS else "No",
                final_score=float(r["final_score"]),
                ai_explanation=_s(r.get("executive_summary")),
                rank=int(r["rank"]),
                ai_insight=_s(r.get("strengths")),
                suggested_plan=json.dumps(plan) if plan else None,
                match_reason=_s(r.get("match_reason")),
                decision_tier=r["decision"],
                confidence_score=conf_num,
                confidence_label=conf_label,
                evidence_flag=_s(r.get("evidence_flag")),
                corporate_group=_s(r.get("corporate_group")),
                business_model=_s(r.get("business_model")),
                value_chain_role=_s(r.get("value_chain_role")),
                value_chain_position=_s(r.get("value_chain_position")),
                value_chain_score=float(r["value_chain_score"]),
                match_type=_s(r.get("match_type")),
                opportunity_status=_s(r.get("opportunity_status")),
                strengths=_s(r.get("strengths")),
                risks=_s(r.get("risks")),
                recommended_engagement=_s(r.get("recommended_engagement")),
                suggested_localization_model=_s(r.get("suggested_localization_model")),
                human_verdict=human.get((cname, oname)),
                model_version=MODEL_VERSION,
                matched_at=now,
            )
            cur.execute(UPSERT, params)
            if cur.fetchone()[0]:
                inserted += 1
            else:
                updated += 1
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

    return dict(dbname=DB["dbname"], companies_created=len(new_companies),
                opportunities_created=len(new_opps), inserted=inserted,
                updated=updated, matched_at=now.isoformat())


def main():
    stats = load_csv(CSV_PATH)
    print(f"Companies created: {stats['companies_created']}")
    print(f"Opportunities created: {stats['opportunities_created']}")
    print(f"Match rows inserted: {stats['inserted']}, updated: {stats['updated']}")
    print(f"All rows tagged model_version='{MODEL_VERSION}', matched_at={stats['matched_at']}")


if __name__ == "__main__":
    main()
