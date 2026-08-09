#!/usr/bin/env python3
"""On-demand single-company rematch (separate from the full batch pipeline).

Pulls one company from the Company table by name or id, scores it against
all opportunities using the v3 methodology, writes insights into
MatchingOutput for that company only (never wipes the portfolio), and
prints a JSON result to stdout for the API.

Usage:
  /opt/anaconda3/bin/python3 on_demand_match_company.py --company-name "Hayat"
  /opt/anaconda3/bin/python3 on_demand_match_company.py --company-id 42 --top-n 8
  /opt/anaconda3/bin/python3 on_demand_match_company.py --company-name "Hameln" --fast
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from types import SimpleNamespace

import pandas as pd

# Ensure project root is importable when spawned from the Node backend.
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
os.chdir(ROOT)

from matching_v2 import (  # noqa: E402
    RUBRIC_HASH, SPECIFICITY_BLEND, build_exemplar_lines, build_vectors,
    cosine_matrix, gpt_validate, load_human_reviews, percentile_rank,
    resolve_backends,
)
from matching_v3 import (  # noqa: E402
    COLUMNS, DEFAULT_WEIGHTS, ENGAGEMENT_VERBS, NARRATIVE_OPENERS, RISK_LENSES,
    SUMMARY_OPENERS, TIER_ORDER, _pair_seed_pick, apply_evidence_guards,
    calibrate_product_similarity, calibrate_profile_similarity,
    compose_readiness, compute_penalties, confidence_label, confidence_score,
    decide, detect_corporate_groups, enrich_all, enforce_single_anchor,
    generate_narrative, gate_cache_key, load_gate_cache, match_type,
    opportunity_status, product_evidence_level, resolve_sector_node,
    save_gate_cache, sector_similarity, value_chain_score,
)
from load_to_db_v3 import (  # noqa: E402
    clear_matches_for_company, load_companies_from_db,
    load_opportunities_from_db, resolve_company_from_db, upsert_matches,
)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def progress(pct: int, stage: str, message: str) -> None:
    """Emit a machine-readable progress line for the Node job poller."""
    pct = max(0, min(100, int(pct)))
    payload = {"pct": pct, "stage": stage, "message": message}
    print(f"PROGRESS {json.dumps(payload, ensure_ascii=False)}", file=sys.stderr, flush=True)
    log(message)


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description="On-demand rematch for one company")
    ap.add_argument("--company-name", default=None)
    ap.add_argument("--company-id", type=int, default=None)
    ap.add_argument("--top-n", type=int, default=8,
                    help="How many top opportunity matches to gate/narrate/upsert")
    ap.add_argument("--fast", action="store_true",
                    help="1-vote gate, skip narratives (faster UI response)")
    ap.add_argument("--no-db", action="store_true",
                    help="Score only; do not write MatchingOutput")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--gpt-votes", type=int, default=3)
    ap.add_argument("--human-reviews", default="Data/human_reviews.csv")
    ap.add_argument("--env-file", default=None)
    ap.add_argument("--chat-provider", default=None)
    return ap.parse_args(argv)


def match_company_on_demand(args) -> dict:
    if not args.company_id and not args.company_name:
        raise ValueError("Provide --company-name or --company-id")

    try:
        from dotenv import load_dotenv
        load_dotenv(".env")
        if args.env_file:
            load_dotenv(args.env_file, override=True)
    except ImportError:
        pass

    progress(2, "resolve", "Resolving company from database…")
    target = resolve_company_from_db(
        company_id=args.company_id, company_name=args.company_name)
    company_pk = int(target["id"])
    company_label = target["company_name"]
    progress(8, "resolve", f"Loaded company {company_label!r} (id={company_pk})")

    # Full universe keeps percentile ranks meaningful; we only score the target.
    progress(12, "load", "Loading companies and opportunities from database…")
    companies = load_companies_from_db(require_profile=True)
    opps = load_opportunities_from_db()
    target_mask = companies["db_id"].astype(int) == company_pk
    if not target_mask.any():
        # Target may have a short profile; reload without profile filter and splice in.
        one = load_companies_from_db(
            require_profile=False, company_id=company_pk)
        if one.empty:
            raise LookupError(f"Company id={company_pk} not loadable from DB")
        companies = pd.concat([companies, one], ignore_index=True)
        companies = companies.drop_duplicates(subset=["db_id"], keep="last").reset_index(drop=True)
        target_mask = companies["db_id"].astype(int) == company_pk
    if not target_mask.any():
        raise LookupError(f"Company id={company_pk} missing after load")
    target_i = int(companies.index[target_mask][0])

    human = load_human_reviews(args.human_reviews)
    groups = detect_corporate_groups(companies["company_name"])

    # Backend resolution (Azure chat required for gate / narratives).
    ns = SimpleNamespace(
        chat_provider=args.chat_provider or "auto",
        embed_provider=None,
        no_openai=False,
        require_openai=False,
        workers=args.workers,
        no_escalate=False,
        fresh_gate=False,
        gpt_votes=1 if args.fast else args.gpt_votes,
        no_narratives=bool(args.fast),
        top_n=args.top_n,
        narrative_top=args.top_n,
        weights=None,
        source="db",
    )
    backends = resolve_backends(ns)
    chat_client, chat_models = backends["chat_client"], backends["chat_models"]
    if chat_client is None:
        raise RuntimeError("Chat backend unavailable - cannot run on-demand match")

    weights = dict(DEFAULT_WEIGHTS)
    wsum = sum(weights.values())
    weights = {k: v / wsum for k, v in weights.items()}

    progress(
        18, "load",
        f"Loaded {len(companies)} companies, {len(opps)} opportunities "
        f"(scoring {company_label!r})"
    )

    progress(22, "embed", "Building embedding vectors…")
    prof_mat, prod_mat, opp_mat, mode = build_vectors(companies, opps, ns, backends)
    progress(32, "embed", f"Embedding backend: {mode.upper()}")
    sim_profile = cosine_matrix(prof_mat, opp_mat)
    sim_product = cosine_matrix(prod_mat, opp_mat)
    pct_profile = percentile_rank(sim_profile)
    pct_product = percentile_rank(sim_product)
    spec_profile = percentile_rank(sim_profile - sim_profile.mean(axis=1, keepdims=True))
    spec_product = percentile_rank(sim_product - sim_product.mean(axis=1, keepdims=True))
    sem_profile = (1 - SPECIFICITY_BLEND) * pct_profile + SPECIFICITY_BLEND * spec_profile
    sem_product = (1 - SPECIFICITY_BLEND) * pct_product + SPECIFICITY_BLEND * spec_product
    progress(40, "embed", "Similarity matrices ready")

    # Enrich target company + all opportunities (opp enrich is largely cached).
    target_frame = companies.iloc[[target_i]].reset_index(drop=True)
    progress(45, "enrich", "Enriching company and opportunities…")
    comp_enrich, opp_enrich = enrich_all(
        chat_client, chat_models, target_frame, opps, workers=args.workers)
    progress(55, "enrich", "Enrichment complete")

    comp = companies.iloc[target_i]
    ce = comp_enrich.get(comp["company_name"], {})
    c_node = resolve_sector_node(comp["Sector"], ce.get("normalized_sector") or "")
    c_role = ce.get("value_chain_role", "")
    c_role2 = ce.get("secondary_role", "")
    c_bm = str(ce.get("business_model", "") or "")
    c_products = [str(p) for p in (ce.get("evidenced_products") or [])]
    c_evq = float(ce.get("evidence_quality", 0.4) or 0.4)
    dims = ce.get("readiness", {}) or {}
    readiness, strategic, localization = compose_readiness(dims)
    class_conf = float(ce.get("classification_confidence", 0.3) or 0.3)
    comp_len = len(str(comp["company_profile"])) + len(str(comp["product and Services"]))

    progress(58, "score", f"Scoring {company_label!r} against {len(opps)} opportunities…")
    opp_names = opps["What is the opportunity name?"].tolist()
    rows = []
    i = target_i
    for j, (_, opp) in enumerate(opps.iterrows()):
        oe = opp_enrich.get(opp_names[j], {})
        o_node = resolve_sector_node(opp["Sector"], oe.get("normalized_sector") or "")
        required = oe.get("required_roles", []) or []
        o_bm = str(oe.get("business_model_needed", "") or "")
        end_product = str(oe.get("end_product", "") or "")
        s_sim = sector_similarity(c_node, o_node)
        vc = value_chain_score(required, c_role, c_role2)
        ev_level = product_evidence_level(end_product, c_products)
        exact = ev_level == 2
        p_sem = calibrate_profile_similarity(float(sem_profile[i, j]), c_bm, o_bm)
        pr_sem = calibrate_product_similarity(float(sem_product[i, j]), c_bm, ev_level)
        base = (weights["sector"] * s_sim + weights["profile"] * p_sem
                + weights["product"] * pr_sem + weights["value_chain"] * vc
                + weights["readiness"] * readiness
                + weights["strategic"] * strategic
                + weights["localization"] * localization)
        factor, applied = compute_penalties(s_sim, p_sem, pr_sem, vc, c_role, required)
        final = round(max(0.05, base * factor), 3)
        opportunity_pk = int(opp["db_id"])
        rows.append({
            "company_id": company_pk, "company_name": comp["company_name"],
            "opportunity_id": opportunity_pk, "opportunity_name": opp_names[j],
            "corporate_group": groups.get(comp["company_name"], ""),
            "company_sector": comp["Sector"], "normalized_sector": c_node,
            "opportunity_sector": opp["Sector"],
            "sector_similarity": round(s_sim, 3),
            "profile_similarity": p_sem,
            "product_similarity": pr_sem,
            "value_chain_score": vc,
            "investment_readiness_score": readiness,
            "strategic_fit_score": strategic,
            "localization_score": localization,
            "final_score": final,
            "_penalties": ";".join(applied),
            "_class_conf": class_conf, "_comp_len": comp_len,
            "_role": c_role, "_required": required, "_i": i, "_j": j,
            "_bm": c_bm, "_products": c_products, "_evq": c_evq,
            "_end_product": end_product, "_exact": exact,
            "_ev_level": ev_level,
        })

    df = pd.DataFrame(rows)
    df["rank"] = (df["final_score"].rank(method="first", ascending=False).astype(int))
    df["_export"] = df["rank"] <= args.top_n
    progress(68, "score", f"Scored {len(df)} pairs - shortlisting top {args.top_n}")

    # Gate only the export shortlist for this company.
    exemplar_pairs = build_exemplar_lines(human, companies)
    df["gate"] = ""
    df["gate_agreement"] = ""
    df["gate_depth"] = ""
    todo = df[df["_export"]]
    votes = 1 if args.fast else args.gpt_votes
    progress(72, "gate", f"Gate: validating {len(todo)} pairs ({votes}-vote)…")

    gate_cache = load_gate_cache()
    _gate_lock = threading.Lock()

    def _voted_or_cached(row, n_votes):
        lines = [l for p, l in exemplar_pairs
                 if p != (row["company_name"], row["opportunity_name"])][-8:]
        exemplars = "\n".join(lines)
        # _i/_j refer to positions in companies/opps frames
        comp_row, opp_row = companies.iloc[row["_i"]], opps.iloc[row["_j"]]
        key = gate_cache_key(comp_row, opp_row, exemplars)
        with _gate_lock:
            cached = gate_cache.get(key)
        if cached and cached.get("votes", 0) >= n_votes:
            return (cached["fit"], cached.get("confidence", 0.0), "",
                    cached.get("model"), cached["agreement"])
        fit, conf, expl, model, agree = gpt_validate(
            chat_client, chat_models, comp_row, opp_row,
            votes=n_votes, escalate=not args.fast, exemplars=exemplars)
        if fit != "Not Run":
            n_samples = (int(str(agree).split("/")[1])
                         if "/" in str(agree) else n_votes)
            with _gate_lock:
                gate_cache[key] = {
                    "fit": fit, "agreement": agree, "confidence": conf,
                    "model": model, "votes": max(n_votes, n_samples),
                    "company": row["company_name"],
                    "opportunity": row["opportunity_name"],
                    "rubric": RUBRIC_HASH,
                    "ts": datetime.now(timezone.utc).isoformat(),
                }
        return fit, conf, expl, model, agree

    def _gate(item):
        idx, row = item
        return idx, _voted_or_cached(row, votes)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        for idx, (fit, conf, expl, model, agree) in ex.map(_gate, list(todo.iterrows())):
            df.at[idx, "gate"] = fit
            df.at[idx, "gate_agreement"] = agree
            df.at[idx, "gate_depth"] = "full" if votes >= 3 else "light"
    save_gate_cache(gate_cache)
    progress(82, "gate", "Gate validation complete")

    decisions, confidences, ai_scores, evidence_flags = [], [], [], []
    for _, r in df.iterrows():
        if not r["_export"]:
            decisions.append("")
            confidences.append("")
            ai_scores.append(0)
            evidence_flags.append("")
            continue
        agree = str(r["gate_agreement"] or "")
        light = (int(agree.split("/")[1]) < 3) if "/" in agree else (r["gate_depth"] == "light")
        hv = {1: "Agree", 0: "Disagree"}.get(
            human.get((r["company_name"], r["opportunity_name"]), -1), "")
        d = decide(r["final_score"], r["gate"], hv, bool(r["gate"]), light=light)
        comps = [r["sector_similarity"], r["profile_similarity"], r["product_similarity"],
                 r["value_chain_score"], r["investment_readiness_score"]]
        c = confidence_score(r["_comp_len"], 1500, r["_class_conf"], comps,
                             r["gate_agreement"],
                             sector_sim=float(r["sector_similarity"]),
                             penalized=bool(r["_penalties"]),
                             evidence_quality=float(r["_evq"]),
                             exact_product=bool(r["_exact"]),
                             ev_level=int(r["_ev_level"]))
        d, guards = apply_evidence_guards(d, c, float(r["sector_similarity"]),
                                          int(r["_ev_level"]), int(r["_comp_len"]), hv)
        decisions.append(d)
        confidences.append(f"{c} ({confidence_label(c)})")
        ai_scores.append(1 if TIER_ORDER.index(d) <= TIER_ORDER.index("Good Match") else 0)
        evidence_flags.append(";".join(guards))
    df["decision"] = decisions
    df["confidence_score"] = confidences
    df["ai_score"] = ai_scores
    df["evidence_flag"] = evidence_flags
    df["human_verdict"] = [
        {1: "Agree", 0: "Disagree"}.get(
            human.get((r.company_name, r.opportunity_name), -1), "")
        for r in df.itertuples()]

    out_rows = df[df["_export"]].copy()
    for k in ["strengths", "risks", "value_chain_position",
              "recommended_engagement", "suggested_localization_model",
              "match_reason", "executive_summary",
              "profile_match_reason", "product_match_reason"]:
        out_rows[k] = ""

    if not args.fast:
        progress(85, "narratives", f"Generating insights for {len(out_rows)} matches…")

        def _narr(item):
            idx, row = item
            g = generate_narrative(
                chat_client, chat_models,
                companies.iloc[row["_i"]], opps.iloc[row["_j"]],
                row["decision"], row["_role"], row["_required"],
                business_model=row["_bm"],
                evidenced_products=row["_products"],
                end_product=row["_end_product"],
                exact_product=bool(row["_exact"]),
                opener=_pair_seed_pick(
                    "opener", row["company_name"], row["opportunity_name"],
                    NARRATIVE_OPENERS),
                verb=_pair_seed_pick(
                    "verb", row["company_name"], row["opportunity_name"],
                    ENGAGEMENT_VERBS),
                risk_lens=_pair_seed_pick(
                    "risk", row["company_name"], row["opportunity_name"],
                    RISK_LENSES),
                summary_opener=_pair_seed_pick(
                    "summary", row["company_name"], row["opportunity_name"],
                    SUMMARY_OPENERS))
            return idx, g

        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            for idx, g in ex.map(_narr, list(out_rows.iterrows())):
                for k, v in g.items():
                    out_rows.at[idx, k] = v
        progress(92, "narratives", "Insights generated")
    else:
        progress(90, "narratives", "Fast mode - skipping narrative generation")

    rejected = out_rows["decision"].isin(["Weak Match", "Poor Match"])
    out_rows.loc[rejected, "recommended_engagement"] = ""
    out_rows.loc[rejected, "suggested_localization_model"] = "Not recommended"
    out_rows["value_chain_role"] = out_rows["_role"]
    out_rows["business_model"] = out_rows["_bm"]
    out_rows["match_type"] = [
        match_type(r["decision"], float(r["value_chain_score"]),
                   r["suggested_localization_model"], r["_role"],
                   ev_level=int(r["_ev_level"]),
                   required_roles=r["_required"] if isinstance(r["_required"], list) else [])
        for _, r in out_rows.iterrows()]
    enforce_single_anchor(out_rows)
    status_by_opp = {
        oid: opportunity_status(list(zip(g["decision"], g["match_type"])))
        for oid, g in out_rows.groupby("opportunity_id")}
    out_rows["opportunity_status"] = out_rows["opportunity_id"].map(status_by_opp)

    # Rank by pursue priority for this company (tier then score).
    out_rows["_tier"] = out_rows["decision"].map({t: i for i, t in enumerate(TIER_ORDER)})
    out_rows = out_rows.sort_values(["_tier", "final_score"], ascending=[True, False],
                                    kind="mergesort")
    out_rows["rank"] = range(1, len(out_rows) + 1)
    out = out_rows[[c for c in COLUMNS if c in out_rows.columns]].copy()
    for c in COLUMNS:
        if c not in out.columns:
            out[c] = ""
    out = out[COLUMNS]

    db_stats = {"inserted": 0, "updated": 0, "cleared": 0}
    if not args.no_db:
        progress(94, "persist", "Updating MatchingOutput for this company…")
        cleared = clear_matches_for_company(company_pk)
        db_stats["cleared"] = cleared
        log(f"Cleared {cleared} prior MatchingOutput rows for company {company_pk}")
        stats = upsert_matches(out)
        db_stats.update(stats)
        log(f"Upserted: +{stats['inserted']} / ~{stats['updated']}")
        progress(98, "persist", f"Saved {stats['inserted'] + stats['updated']} matches")

    progress(100, "done", f"Rematch complete - {len(out)} matches ready")

    matches = []
    for _, r in out.iterrows():
        matches.append({
            "opportunityId": int(r["opportunity_id"]),
            "opportunityName": r["opportunity_name"],
            "opportunitySector": r["opportunity_sector"],
            "finalScore": float(r["final_score"]),
            "decisionTier": r["decision"],
            "aiDecision": "Yes" if r["decision"] in {
                "Excellent Match", "Strong Match", "Good Match"} else "No",
            "rank": int(r["rank"]),
            "confidenceScore": str(r.get("confidence_score") or ""),
            "strengths": r.get("strengths") or "",
            "risks": r.get("risks") or "",
            "matchReason": r.get("match_reason") or "",
            "recommendedEngagement": r.get("recommended_engagement") or "",
        })

    return {
        "ok": True,
        "mode": "on_demand",
        "fast": bool(args.fast),
        "companyId": company_pk,
        "companyName": company_label,
        "matchCount": len(matches),
        "matches": matches,
        "db": db_stats,
        "finishedAt": datetime.now(timezone.utc).isoformat(),
    }


def main(argv=None):
    args = parse_args(argv)
    try:
        result = match_company_on_demand(args)
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:
        err = {
            "ok": False,
            "error": str(exc),
            "companyName": args.company_name,
            "companyId": args.company_id,
        }
        print(json.dumps(err, ensure_ascii=False))
        log(f"FAILED: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
