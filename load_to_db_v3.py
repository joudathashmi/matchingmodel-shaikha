#!/usr/bin/env python3
"""Database I/O for matching_v3 against the local "matchmaking F" Postgres DB.

Primary path (DB-native):
  - load_companies_from_db / load_opportunities_from_db  → pipeline DataFrames
  - upsert_matches(df)  → MatchingOutput keyed by existing companyId/opportunityId

Legacy path (Excel → DB, kept for back-compat):
  - load_csv() still upserts a CSV and may create missing Company/Opportunity
    rows from the Excel sources.
"""

from __future__ import annotations

import csv
import json
import math
import os
import re
from datetime import datetime, timezone

import pandas as pd
import psycopg2
from sqlalchemy import create_engine

from matching_v2 import (
    canonical_name,
    focus_company_text,
    focus_opportunity_text,
    preprocess,
)

CSV_PATH = "Output/matching_output_v3.csv"
COMPANIES_XLSX = "Data/companies.xlsx"
OPPORTUNITIES_XLSX = "Data/new_opportunities.xlsx"
HUMAN_REVIEWS = "Data/human_reviews.csv"
MODEL_VERSION = "v3"
YES_TIERS = {"Excellent Match", "Strong Match", "Good Match"}


def connect():
    from db_env import connect_matchdb

    return connect_matchdb()


def sql_engine():
    # Use a creator so the DB name with a space ("matchmaking F") is never
    # mangled by URL encoding.
    return create_engine("postgresql+psycopg2://", creator=connect)


def _s(v):
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    s = str(v).strip()
    return s or None


def parse_confidence(v):
    m = re.match(r"\s*(\d+)\s*\((\w+)\)", str(v))
    return (int(m.group(1)), m.group(2)) if m else (None, None)


# ------------------------------ DB → pipeline -------------------------------


def load_companies_from_db(limit: int | None = None,
                           require_profile: bool = True,
                           company_id: int | None = None,
                           company_name: str | None = None) -> pd.DataFrame:
    """Load Company rows shaped like the Excel loader output, plus db_id.

    Optional company_id / company_name filters support on-demand rematch.
    company_name uses case-insensitive exact match first, then ILIKE contains.
    """
    sql = '''
        SELECT id AS db_id,
               company_name,
               coalesce(company_sector, '') AS "Sector",
               coalesce(company_profile, '') AS company_profile,
               coalesce(product_services, '') AS "product and Services"
        FROM "Company"
        WHERE coalesce(company_name, '') <> ''
    '''
    params: list = []
    if company_id is not None:
        sql += " AND id = %(company_id)s"
        params.append(("company_id", int(company_id)))
    if company_name:
        # Prefer exact (case-insensitive); caller may widen if empty.
        sql += " AND lower(company_name) = lower(%(company_name)s)"
        params.append(("company_name", company_name.strip()))
    if require_profile:
        sql += " AND length(coalesce(company_profile, '')) > 20"
    sql += " ORDER BY id"
    if limit:
        sql += f" LIMIT {int(limit)}"

    bind = {k: v for k, v in params}
    with sql_engine().connect() as conn:
        df = pd.read_sql(sql, conn, params=bind or None)

    # Fallback: contains match when exact name missed
    if df.empty and company_name and company_id is None:
        sql2 = '''
            SELECT id AS db_id,
                   company_name,
                   coalesce(company_sector, '') AS "Sector",
                   coalesce(company_profile, '') AS company_profile,
                   coalesce(product_services, '') AS "product and Services"
            FROM "Company"
            WHERE coalesce(company_name, '') <> ''
              AND company_name ILIKE %(q)s
        '''
        if require_profile:
            sql2 += " AND length(coalesce(company_profile, '')) > 20"
        sql2 += " ORDER BY length(company_name) ASC, id LIMIT 5"
        with sql_engine().connect() as conn:
            df = pd.read_sql(sql2, conn, params={"q": f"%{company_name.strip()}%"})

    if df.empty:
        raise RuntimeError('No companies found in "Company" table')

    # Deduplicate by canonical name (same rule as the Excel loader).
    df["_canon"] = df["company_name"].map(canonical_name)
    df["_richness"] = (df["company_profile"].astype(str).str.len()
                       + df["product and Services"].astype(str).str.len())
    merged = []
    for key, grp in df.groupby("_canon"):
        if len(grp) > 1:
            keep = grp["_richness"].idxmax()
            dropped = grp.drop(index=keep)["company_name"].tolist()
            merged.append((grp.loc[keep, "company_name"], dropped))
    if merged:
        keep_idx = df.groupby("_canon")["_richness"].idxmax()
        df = df.loc[sorted(keep_idx)]
        for kept, dropped in merged:
            print(f"Entity resolution: kept '{kept}', merged duplicate(s): {dropped}")
    df = df.drop(columns=["_canon", "_richness"])

    raw_combined = (
        df[["company_name", "company_profile", "product and Services"]]
        .astype(str).agg(" ".join, axis=1)
    )
    df["combined"] = raw_combined.apply(preprocess)
    df["combined_focused"] = raw_combined.apply(
        lambda t: preprocess(focus_company_text(t)))
    df["products_clean"] = df["product and Services"].astype(str).apply(preprocess)
    # OpenAI embeddings reject empty strings; keep a stable placeholder.
    for col in ("combined", "combined_focused", "products_clean"):
        empty = df[col].astype(str).str.strip() == ""
        if empty.any():
            df.loc[empty, col] = "unspecified"
    df.attrs["merged_entities"] = merged
    return df.reset_index(drop=True)


def load_opportunities_from_db(limit: int | None = None) -> pd.DataFrame:
    """Load Opportunity rows mapped onto the Excel column names the rest of
    the pipeline still reads."""
    sql = '''
        SELECT id AS db_id,
               opportunity_name AS "What is the opportunity name?",
               coalesce(sector, '') AS "Sector",
               coalesce(opportunity_description, '') AS "What is the opportunity description?",
               coalesce(investment_highlights, '') AS "What are the investment highlights?",
               coalesce(value_proposition, '') AS "What is the value proposition of this opportunity?",
               coalesce(key_demand_drivers, '') AS "What are the key demand drivers?",
               coalesce(materials_required, '') AS "What materials are involved or required in the project?",
               coalesce(key_players, '') AS "Who are the key players in this sector or project?",
               '' AS "Market data",
               '' AS "Risks and mitigations"
        FROM "Opportunity"
        WHERE coalesce(opportunity_name, '') <> ''
        ORDER BY id
    '''
    if limit:
        sql += f" LIMIT {int(limit)}"

    with sql_engine().connect() as conn:
        df = pd.read_sql(sql, conn)

    if df.empty:
        raise RuntimeError('No opportunities found in "Opportunity" table')

    fields = [
        "What is the opportunity name?", "What is the opportunity description?",
        "What are the investment highlights?",
        "What is the value proposition of this opportunity?",
        "What are the key demand drivers?",
        "What materials are involved or required in the project?",
        "Who are the key players in this sector or project?",
        "Market data", "Risks and mitigations",
    ]
    raw_req = df.apply(lambda r: " ".join(str(r.get(f, "")) for f in fields), axis=1)
    df["requirement"] = raw_req.apply(preprocess)
    df["requirement_focused"] = raw_req.apply(
        lambda t: preprocess(focus_opportunity_text(t)))
    for col in ("requirement", "requirement_focused"):
        empty = df[col].astype(str).str.strip() == ""
        if empty.any():
            df.loc[empty, col] = "unspecified"
    return df.reset_index(drop=True)


# ------------------------------ MatchingOutput upsert -----------------------


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
    for table in ("MatchingOutput", "Company", "Opportunity"):
        cur.execute(
            f'SELECT setval(\'"{table}_id_seq"\', '
            f'(SELECT COALESCE(MAX(id), 1) FROM "{table}"))')


def clear_matching_output(model_version: str | None = MODEL_VERSION) -> int:
    """Delete MatchingOutput rows (and dependent MatchAgreement) before a
    fresh DB-native run. Pass model_version=None to wipe the whole table."""
    with connect() as conn:
        with conn.cursor() as cur:
            if model_version is None:
                cur.execute('DELETE FROM "MatchAgreement"')
                cur.execute('DELETE FROM "MatchingOutput"')
            else:
                cur.execute(
                    'DELETE FROM "MatchAgreement" WHERE "matchId" IN '
                    '(SELECT id FROM "MatchingOutput" WHERE model_version = %s)',
                    (model_version,))
                cur.execute(
                    'DELETE FROM "MatchingOutput" WHERE model_version = %s',
                    (model_version,))
            n = cur.rowcount
        conn.commit()
    return n


def clear_matches_for_company(company_id: int) -> int:
    """Delete MatchingOutput (+ agreements) for one company only.

    Used by on-demand rematch so a single-company refresh never wipes the
    rest of the portfolio.
    """
    cid = int(company_id)
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                'DELETE FROM "MatchAgreement" WHERE "matchId" IN '
                '(SELECT id FROM "MatchingOutput" WHERE "companyId" = %s)',
                (cid,))
            cur.execute(
                'DELETE FROM "MatchingOutput" WHERE "companyId" = %s',
                (cid,))
            n = cur.rowcount
        conn.commit()
    return n


def resolve_company_from_db(company_id: int | None = None,
                            company_name: str | None = None) -> dict:
    """Resolve a single Company row for on-demand rematch.

    Returns dict with id, company_name, company_sector, company_profile,
    product_services. Raises LookupError if not found / ambiguous.
    """
    if company_id is None and not company_name:
        raise ValueError("company_id or company_name is required")

    with connect() as conn:
        with conn.cursor() as cur:
            if company_id is not None:
                cur.execute(
                    'SELECT id, company_name, company_sector, company_profile, '
                    'product_services FROM "Company" WHERE id = %s',
                    (int(company_id),))
                row = cur.fetchone()
                if not row:
                    raise LookupError(f"No company with id={company_id}")
                cols = [d[0] for d in cur.description]
                return dict(zip(cols, row))

            name = company_name.strip()
            cur.execute(
                'SELECT id, company_name, company_sector, company_profile, '
                'product_services FROM "Company" '
                'WHERE lower(company_name) = lower(%s) '
                'ORDER BY id LIMIT 5',
                (name,))
            rows = cur.fetchall()
            if not rows:
                cur.execute(
                    'SELECT id, company_name, company_sector, company_profile, '
                    'product_services FROM "Company" '
                    'WHERE company_name ILIKE %s '
                    'ORDER BY length(company_name) ASC, id LIMIT 5',
                    (f"%{name}%",))
                rows = cur.fetchall()
            if not rows:
                raise LookupError(f"No company matching name={name!r}")
            cols = [d[0] for d in cur.description]
            if len(rows) > 1:
                # Prefer exact-case-insensitive single; else first shortest
                exact = [r for r in rows if str(r[1]).lower() == name.lower()]
                pick = exact[0] if exact else rows[0]
            else:
                pick = rows[0]
            return dict(zip(cols, pick))


def _ui_explanation(r) -> str | None:
    """Build a 3-part explanation the frontend accordion expects.

    Active Matches parses numbered lines into:
      [0] Profile and Product Match
      [1] Strategic Capability Alignment
      [2] Value Proposition
    """
    strengths = _s(r.get("strengths"))
    risks = _s(r.get("risks"))
    engagement = _s(r.get("recommended_engagement"))
    summary = _s(r.get("executive_summary"))
    match_reason = _s(r.get("match_reason"))
    profile = _s(r.get("profile_match_reason"))
    product = _s(r.get("product_match_reason"))

    part1 = strengths or profile or product or summary
    part2 = engagement or product or match_reason or risks
    part3 = summary or match_reason or risks or engagement

    parts = [p for p in (part1, part2, part3) if p]
    # Deduplicate while preserving order
    seen = set()
    uniq = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    if not uniq:
        return None
    # Pad to 3 slots so each accordion has content when only 1-2 fields exist
    while len(uniq) < 3:
        uniq.append(uniq[-1])
    return "\n".join(f"{i}. {p}" for i, p in enumerate(uniq[:3], 1))


def _ui_match_reason(r) -> str | None:
    """JSON array string for the GUI Match Reason list."""
    raw = r.get("match_reason")
    items: list[str] = []
    if isinstance(raw, list):
        items = [str(x).strip() for x in raw if str(x).strip()]
    else:
        s = _s(raw)
        if s:
            parsed = None
            if s.startswith("["):
                try:
                    parsed = json.loads(s)
                except Exception:
                    try:
                        # Only repair true single-quoted JSON arrays, not apostrophes
                        if s.startswith("['") or s.startswith('["'):
                            parsed = json.loads(s.replace("'", '"'))
                    except Exception:
                        parsed = None
            if isinstance(parsed, list):
                items = [str(x).strip() for x in parsed if str(x).strip()]
            elif parsed is not None:
                items = [str(parsed).strip()]
            else:
                parts = [p.strip() for p in re.split(r"(?<=\.)\s+", s) if p.strip()]
                items = parts if len(parts) > 1 else [s]
    if not items:
        for key in ("strengths", "executive_summary", "profile_match_reason"):
            v = _s(r.get(key))
            if v:
                items = [v]
                break
    return json.dumps(items) if items else None


def _row_params(r, human: dict, now) -> dict:
    cname = str(r["company_name"]).strip()
    oname = str(r["opportunity_name"]).strip()
    conf_num, conf_label = parse_confidence(r.get("confidence_score", ""))
    plan = [p for p in (_s(r.get("recommended_engagement")),
                        _s(r.get("suggested_localization_model"))) if p]
    company_id = int(r["company_id"])
    opportunity_id = int(r["opportunity_id"])
    hv = _s(r.get("human_verdict")) or human.get((cname, oname))
    return dict(
        companyId=company_id,
        opportunityId=opportunity_id,
        company_name=cname,
        opportunity_name=oname,
        company_sector=_s(r.get("company_sector")),
        opportunity_sector=_s(r.get("opportunity_sector")),
        sector_similarity=float(r["sector_similarity"]),
        profile_similarity=float(r["profile_similarity"]),
        product_similarity=float(r["product_similarity"]),
        ai_score=float(r["ai_score"]),
        ai_decision="Yes" if r["decision"] in YES_TIERS else "No",
        final_score=float(r["final_score"]),
        ai_explanation=_ui_explanation(r),
        rank=int(r["rank"]),
        ai_insight=_s(r.get("strengths")) or _s(r.get("executive_summary")),
        suggested_plan=json.dumps(plan) if plan else None,
        match_reason=_ui_match_reason(r),
        decision_tier=r["decision"],
        confidence_score=conf_num,
        confidence_label=conf_label,
        evidence_flag=_s(r.get("evidence_flag")),
        corporate_group=_s(r.get("corporate_group")),
        business_model=_s(r.get("business_model")),
        value_chain_role=_s(r.get("value_chain_role")),
        value_chain_position=_s(r.get("value_chain_position")),
        value_chain_score=float(r["value_chain_score"]) if pd.notna(r.get("value_chain_score")) else None,
        match_type=_s(r.get("match_type")),
        opportunity_status=_s(r.get("opportunity_status")),
        strengths=_s(r.get("strengths")),
        risks=_s(r.get("risks")),
        recommended_engagement=_s(r.get("recommended_engagement")),
        suggested_localization_model=_s(r.get("suggested_localization_model")),
        human_verdict=hv,
        model_version=MODEL_VERSION,
        matched_at=now,
    )


def upsert_matches(df: pd.DataFrame, human: dict | None = None) -> dict:
    """Upsert a matching DataFrame that already carries DB company_id /
    opportunity_id values. Does not create Company or Opportunity rows."""
    if "company_id" not in df.columns or "opportunity_id" not in df.columns:
        raise KeyError("DataFrame must include company_id and opportunity_id "
                       "(database primary keys)")
    human = human if human is not None else load_human_verdicts()
    now = datetime.now(timezone.utc)
    inserted = updated = 0

    conn = connect()
    cur = conn.cursor()
    try:
        _sync_sequences(cur)
        for _, r in df.iterrows():
            cur.execute(UPSERT, _row_params(r, human, now))
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

    return dict(dbname=DB["dbname"], companies_created=0, opportunities_created=0,
                inserted=inserted, updated=updated, matched_at=now.isoformat())


# ------------------------------ legacy Excel → DB ---------------------------


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
                    row["verdict"].strip().capitalize()
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


def load_csv(csv_path: str = CSV_PATH) -> dict:
    """Legacy: upsert a CSV, creating missing Company/Opportunity rows from Excel."""
    df = pd.read_csv(csv_path)
    # Prefer DB-native path when the CSV already carries real PK ids that exist.
    if {"company_id", "opportunity_id"}.issubset(df.columns):
        # Heuristic: Excel-era ids were small sequential 1..N; DB ids are large.
        # If max company_id exceeds the CSV company count by a lot, treat as DB ids.
        if df["company_id"].max() > len(df["company_name"].unique()) + 10:
            return upsert_matches(df)

    comp_src = load_company_source()
    opp_src = load_opportunity_source()
    human = load_human_verdicts()
    now = datetime.now(timezone.utc)

    conn = connect()
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
            params = _row_params(
                {**r.to_dict(),
                 "company_id": comp_ids[cname],
                 "opportunity_id": opp_ids[oname]},
                human, now)
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
