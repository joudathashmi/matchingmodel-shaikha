#!/usr/bin/env python3
"""Build a self-contained HTML review page for the v3 matching output.

Reads Output/matching_output_v3.csv (from matching_v3.py) and writes one HTML
page: every opportunity with its ranked candidate companies, decision tier,
confidence, score breakdown, strengths / risks, recommended engagement and
executive summary. Opens in any browser, no server, no internet.

Human-in-the-loop: every card has Agree / Not a fit buttons. Verdicts save in
the browser; "Download my reviews" exports human_reviews.csv - save it as
Data/human_reviews.csv and re-run the model to teach it.

Usage:
  python3 build_review_gui_v3.py               # reads Output/matching_output_v3.csv
  python3 build_review_gui_v3.py --csv PATH --out PATH
"""
from __future__ import annotations

import argparse
import json
import math
import os

import pandas as pd

BRAND = "#02714E"  # MISA green
TIER_ORDER = ["Excellent Match", "Strong Match", "Good Match",
              "Potential Match", "Weak Match", "Poor Match"]


def _clean(v):
    if v is None:
        return ""
    if isinstance(v, float) and math.isnan(v):
        return ""
    return v


def _num(v, digits=1):
    try:
        f = float(v)
        if math.isnan(f):
            return None
        return round(f, digits)
    except (TypeError, ValueError):
        return None


def build_payload(csv: str) -> dict:
    df = pd.read_csv(csv)
    df = df.sort_values(["opportunity_name", "rank"])

    tier_counts = df["decision"].value_counts().to_dict()
    opps = []
    for opp_name, grp in df.groupby("opportunity_name", sort=True):
        first = grp.iloc[0]
        companies = []
        for _, r in grp.iterrows():
            companies.append({
                "name": _clean(r["company_name"]),
                "sector": _clean(r.get("company_sector", "")),
                "role": _clean(r.get("value_chain_role", "")),
                "model": _clean(r.get("business_model", "")),
                "group": _clean(r.get("corporate_group", "")),
                "flag": _clean(r.get("evidence_flag", "")),
                "human": _clean(r.get("human_verdict", "")),
                "vc_position": _clean(r.get("value_chain_position", "")),
                "decision": _clean(r["decision"]),
                "match_type": _clean(r.get("match_type", "")),
                "rank": _num(r.get("rank"), 0),
                "confidence": _clean(r.get("confidence_score", "")),
                "final": _num(r.get("final_score")),
                "scores": {
                    "Sector": _num(r.get("sector_similarity")),
                    "Profile": _num(r.get("profile_similarity")),
                    "Product": _num(r.get("product_similarity")),
                    "Value chain": _num(r.get("value_chain_score")),
                    "Readiness": _num(r.get("investment_readiness_score")),
                    "Strategic": _num(r.get("strategic_fit_score")),
                    "Localization": _num(r.get("localization_score")),
                },
                "summary": _clean(r.get("executive_summary", "")),
                "strengths": _clean(r.get("strengths", "")),
                "risks": _clean(r.get("risks", "")),
                "engagement": _clean(r.get("recommended_engagement", "")),
                "localization": _clean(r.get("suggested_localization_model", "")),
                "reason": _clean(r.get("match_reason", "")),
            })
        opps.append({
            "name": opp_name,
            "sector": _clean(first.get("opportunity_sector", "")),
            "status": _clean(first.get("opportunity_status", "")),
            "companies": companies,
        })

    # Opportunities with the best top candidate first.
    def best_tier(o):
        tiers = [TIER_ORDER.index(c["decision"]) for c in o["companies"]
                 if c["decision"] in TIER_ORDER]
        return min(tiers) if tiers else len(TIER_ORDER)
    opps.sort(key=lambda o: (best_tier(o), o["name"]))

    return {"opportunities": opps, "total": int(len(df)),
            "tiers": {t: int(tier_counts.get(t, 0)) for t in TIER_ORDER},
            "tier_order": TIER_ORDER}


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Matches v3 review</title>
<style>
  :root{ --brand:__BRAND__; --bg:#f7f8f8; --card:#fff; --ink:#1b2129; --muted:#616c77; --line:#e5e9ec; }
  @media (prefers-color-scheme: dark){
    :root{--bg:#12171c;--card:#1b2229;--ink:#e9eef2;--muted:#98a4af;--line:#2b343d;}
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
       font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  header{background:var(--brand);color:#fff;padding:24px 20px}
  .inner{max-width:900px;margin:0 auto}
  header h1{margin:0;font-size:24px;font-weight:650}
  header p{margin:6px 0 0;opacity:.9;font-size:15px}
  header .bar{margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  header button{font:inherit;font-size:13.5px;padding:6px 14px;border-radius:8px;
       border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
  header button.on{background:#fff;color:var(--brand);font-weight:600}
  header .cnt{font-size:13px;opacity:.85}
  main{max-width:900px;margin:0 auto;padding:26px 20px 60px}
  .opp{margin-bottom:38px}
  .opp h2{font-size:19px;margin:0 0 2px;font-weight:650}
  .opp .sec{color:var(--muted);font-size:14px;margin-bottom:12px}
  .co{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--tier,#9aa4ad);
      border-radius:8px;padding:14px 16px;margin-bottom:10px}
  .co .n{font-weight:650;font-size:16.5px}
  .badge{display:inline-block;font-size:12.5px;font-weight:600;padding:1px 10px;border-radius:20px;
      margin-left:8px;color:#fff;background:var(--tier,#9aa4ad);vertical-align:2px}
  .co .s{color:var(--muted);font-size:13.5px;margin-top:1px}
  .co .sum{margin-top:8px;font-size:15px}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
  .chip{font-size:12.5px;background:var(--bg);border:1px solid var(--line);border-radius:6px;
      padding:2px 8px;color:var(--muted)}
  .chip b{color:var(--ink);font-weight:600}
  .chip.warn{color:#b23b3b;border-color:#b23b3b}
  .chip.ok{color:#1f6b3a;border-color:#1f6b3a}
  details{margin-top:10px}
  summary{cursor:pointer;font-size:13.5px;color:var(--brand);font-weight:600}
  .det{font-size:14.5px;margin-top:6px}
  .det h4{margin:8px 0 2px;font-size:13px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted)}
  .rev{margin-top:10px;display:flex;gap:8px}
  .rev button{font:inherit;font-size:13px;padding:4px 12px;border-radius:8px;
      border:1px solid var(--line);background:var(--bg);color:var(--ink);cursor:pointer}
  .rev button.agree.on{background:#1f8a4c;border-color:#1f8a4c;color:#fff}
  .rev button.disagree.on{background:#b23b3b;border-color:#b23b3b;color:#fff}
  .none{background:var(--card);border:1px dashed var(--line);border-radius:8px;padding:14px 16px;
        color:var(--muted);font-size:15px}
</style>
</head>
<body>
<header><div class="inner">
  <h1>Company matches — v3 review</h1>
  <p id="sum"></p>
  <div class="bar" id="filters"></div>
  <div class="bar">
    <button onclick="__export()">Download my reviews</button>
    <span class="cnt" id="cnt"></span>
    <span class="cnt">Save the file as Data/human_reviews.csv and re-run the model to teach it.</span>
  </div>
</div></header>
<main id="main"></main>
<script>
/*__DATA__*/
(function(){
  var D = window.__DATA__;
  var TIER_COLORS = {"Excellent Match":"#02714E","Strong Match":"#1f8a4c","Good Match":"#5aa85e",
    "Potential Match":"#c98a1b","Weak Match":"#9aa4ad","Poor Match":"#b23b3b"};
  var LS = "match_reviews_v3";
  var reviews = {};
  try { reviews = JSON.parse(localStorage.getItem(LS) || "{}"); } catch(e){ reviews = {}; }
  function save(){ try{ localStorage.setItem(LS, JSON.stringify(reviews)); }catch(e){} updateCnt(); }
  function updateCnt(){
    var n = Object.keys(reviews).filter(function(k){return reviews[k];}).length;
    document.getElementById("cnt").textContent = n + " reviewed";
  }
  var esc = function(s){ var d=document.createElement("div"); d.textContent=(s==null?"":String(s)); return d.innerHTML; };

  var strong = D.tiers["Excellent Match"] + D.tiers["Strong Match"];
  document.getElementById("sum").textContent =
    D.total + " scored pairs across " + D.opportunities.length + " opportunities. " +
    strong + " strong-or-better matches.";

  // ---- tier filter ----
  var minTier = "Potential Match";       // default: hide Weak/Poor noise
  var FILTERS = [["Strong Match","Strong+"],["Potential Match","Potential+"],["Poor Match","All"]];
  function renderFilters(){
    var el = document.getElementById("filters");
    el.innerHTML = FILTERS.map(function(f){
      return '<button data-t="'+f[0]+'" class="'+(minTier===f[0]?"on":"")+'">'+f[1]+'</button>';
    }).join("");
    el.querySelectorAll("button").forEach(function(b){
      b.onclick = function(){ minTier = b.getAttribute("data-t"); renderFilters(); render(); };
    });
  }

  window.__export = function(){
    var rows = [["company","opportunity","verdict"]];
    Object.keys(reviews).forEach(function(k){
      if(!reviews[k]) return;
      var p = k.split("||");
      rows.push([p[0], p[1], reviews[k]]);
    });
    var csv = rows.map(function(r){ return r.map(function(v){
      return '"' + String(v==null?"":v).replace(/"/g,'""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv"}));
    a.download = "human_reviews.csv"; a.click();
  };

  var FLAG_LABELS = {"sector_mismatch_cap":"Sector mismatch - capped",
    "thin_profile_cap":"Thin profile - needs data",
    "low_confidence_demotion":"Low confidence - demoted",
    "group_sibling_demoted":"Group sibling - see best-ranked entity"};
  function chips(c){
    var out = "";
    if(c.confidence) out += '<span class="chip">Confidence <b>'+esc(c.confidence)+'</b></span>';
    if(c.human) out += '<span class="chip ok">Analyst <b>'+esc(c.human)+'</b></span>';
    if(c.group) out += '<span class="chip">Group <b>'+esc(c.group)+'</b></span>';
    if(c.flag) String(c.flag).split(";").forEach(function(f){
      out += '<span class="chip warn">'+esc(FLAG_LABELS[f] || f)+'</span>';
    });
    Object.keys(c.scores).forEach(function(k){
      if(c.scores[k] != null) out += '<span class="chip">'+esc(k)+' <b>'+c.scores[k]+'</b></span>';
    });
    return '<div class="chips">'+out+'</div>';
  }

  function detail(c){
    var parts = "";
    if(c.strengths) parts += '<h4>Strengths</h4><div>'+esc(c.strengths)+'</div>';
    if(c.risks) parts += '<h4>Risks</h4><div>'+esc(c.risks)+'</div>';
    if(c.vc_position) parts += '<h4>Value chain position</h4><div>'+esc(c.vc_position)+'</div>';
    if(c.engagement) parts += '<h4>Recommended engagement</h4><div>'+esc(c.engagement)+'</div>';
    if(c.localization) parts += '<h4>Suggested localization model</h4><div>'+esc(c.localization)+'</div>';
    if(c.reason) parts += '<h4>Match reason</h4><div>'+esc(c.reason)+'</div>';
    if(!parts) return "";
    return '<details><summary>Details</summary><div class="det">'+parts+'</div></details>';
  }

  function render(){
    var cutoff = D.tier_order.indexOf(minTier);
    var html = "";
    D.opportunities.forEach(function(o){
      var cos = o.companies.filter(function(c){
        var i = D.tier_order.indexOf(c.decision);
        return i >= 0 && i <= cutoff;
      });
      html += '<div class="opp"><h2>'+esc(o.name)+'</h2><div class="sec">'+
              esc(o.sector)+(o.status ? ' · '+esc(o.status) : '')+'</div>';
      if(cos.length){
        cos.forEach(function(c){
          var id = c.name + "||" + o.name;
          var col = TIER_COLORS[c.decision] || "#9aa4ad";
          html += '<div class="co" style="--tier:'+col+'">'+
                  '<div><span class="n">'+(c.rank!=null ? c.rank+'. ' : '')+esc(c.name)+'</span>'+
                  '<span class="badge">'+esc(c.decision)+'</span></div>'+
                  '<div class="s">'+esc(c.sector)+(c.model ? ' · '+esc(c.model) : (c.role ? ' · '+esc(c.role) : ''))+
                  (c.match_type ? ' · '+esc(c.match_type) : '')+'</div>'+
                  (c.summary ? '<div class="sum">'+esc(c.summary)+'</div>' : '')+
                  chips(c) + detail(c) +
                  '<div class="rev" data-id="'+esc(id)+'">'+
                  '<button class="agree">Agree</button>'+
                  '<button class="disagree">Not a fit</button></div></div>';
        });
      } else {
        html += '<div class="none">No candidate at this tier or better.</div>';
      }
      html += '</div>';
    });
    document.getElementById("main").innerHTML = html;

    document.querySelectorAll(".rev").forEach(function(bar){
      var id = bar.getAttribute("data-id");
      var a = bar.querySelector(".agree"), d = bar.querySelector(".disagree");
      function paint(){
        a.classList.toggle("on", reviews[id] === "agree");
        d.classList.toggle("on", reviews[id] === "disagree");
      }
      a.onclick = function(){ reviews[id] = (reviews[id]==="agree" ? "" : "agree"); save(); paint(); };
      d.onclick = function(){ reviews[id] = (reviews[id]==="disagree" ? "" : "disagree"); save(); paint(); };
      paint();
    });
  }

  renderFilters();
  render();
  updateCnt();
})();
</script>
</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", default="Output/matching_output_v3.csv")
    ap.add_argument("--out", default="Output/matches_review_v3.html")
    args = ap.parse_args()

    if not os.path.exists(args.csv):
        raise SystemExit(f"Not found: {args.csv} (run matching_v3.py first).")
    payload = build_payload(args.csv)
    page = (TEMPLATE.replace("__BRAND__", BRAND)
            .replace("/*__DATA__*/", "window.__DATA__ = " + json.dumps(payload, ensure_ascii=False) + ";"))
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(page)
    strong = payload["tiers"]["Excellent Match"] + payload["tiers"]["Strong Match"]
    print(f"Wrote {args.out}: {payload['total']} pairs, "
          f"{strong} strong-or-better matches.")


if __name__ == "__main__":
    main()
