#!/usr/bin/env python3
"""Investment-grade matching engine (v3).

Redesign of the matching methodology so the engine reasons like an investment
analyst, not a semantic search engine. Reuses the proven v2 infrastructure
(embeddings + focus blend, graded GPT gate with self-consistency voting,
analyst overrides, drift-instrumented labels) and adds:

  1. Hierarchical sector taxonomy: synonym normalization, parent-child
     relationships, cross-family affinities. Sector similarity is graded, never
     an exact-string 0/1.
  2. Value-chain intelligence: every company is classified into a value-chain
     role (GPT, cached); every opportunity declares the roles it needs; a
     compatibility matrix scores the pairing (a raw-material supplier is not a
     drug developer).
  3. Investment readiness: 15 sub-dimensions scored per company from its
     profile (GPT, cached, conservative on missing evidence), composed into
     readiness / strategic-fit / localization scores.
  4. Configurable weighted scoring (defaults: sector 20, profile 20, product
     15, value chain 15, readiness 15, strategic 10, localization 5) with
     explicit false-positive penalties, each recorded on the row.
  5. Six-tier decisions (Excellent/Strong/Good/Potential/Weak/Poor Match),
     confidence 0-100, and balanced narratives: strengths, risks, recommended
     engagement, suggested localization model, executive summary.
  6. Evidence-based calibration (2026-07-27): raw percentile similarity is
     bounded by verifiable evidence. profile_similarity is capped by
     business-model compatibility (1.0 identical, 0.8 close, 0.6 partial,
     0.4 indirect); product_similarity is banded per pair by how the
     company's explicitly evidenced products relate to the opportunity's
     required end product (>0.90 only with exact-product evidence; same
     product family <=0.90; enabling components <=0.80; raw materials
     <=0.55). Narratives follow strict evidence rules: no assumed
     certifications or capabilities, "No public evidence was identified..."
     for missing evidence, verified-verb discipline, maturity-matched
     engagement, and an explicit value_chain_position per row. Confidence
     weighs evidence quality (High >=80 needs strong public evidence).

Usage:
  python3 matching_v3.py                     # DB Company/Opportunity → MatchingOutput
  python3 matching_v3.py --source excel      # legacy Excel files
  python3 matching_v3.py --no-narratives     # scores + decisions only (fast)
  python3 matching_v3.py --weights my.json   # override scoring weights
  python3 matching_v3.py --limit-companies 50 --limit-opportunities 20
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd

from matching_v2 import (
    GPT_MODELS, LABELS_JSONL, RUBRIC_HASH, SPECIFICITY_BLEND,
    build_exemplar_lines, build_vectors, gpt_validate, load_companies,
    load_human_reviews, load_opportunities, load_prior_verdicts, percentile_rank,
    resolve_backends,
)
from datetime import datetime, timezone

OUTPUT_CSV = "Output/matching_output_v3.csv"
ENRICH_CACHE = "Output/enrichment_cache_v3.json"
# Gate persistence (audit fix A1, 2026-07-28): verdicts are cached keyed by the
# exact inputs the gate judges (company text, opportunity text, rubric version,
# exemplar precedents). A pair is only re-voted when any of those change, so
# borderline pairs can no longer flip between runs on fresh sampling alone.
GATE_CACHE = "Output/gate_cache_v3.json"

# ------------------------------ sector taxonomy ------------------------------

# family -> leaves. A label may also normalize to the family itself.
TAXONOMY = {
    "industrial": {"industrial manufacturing", "electrical equipment",
                   "industrial automation", "robotics", "machinery",
                   "metals & fabrication", "engineering & construction",
                   "industrial equipment"},
    "ict": {"ict hardware", "electronics", "telecom equipment", "software",
            "semiconductors"},
    "healthcare": {"pharmaceutical manufacturing", "biotechnology",
                   "medical devices", "healthcare services"},
    "energy": {"oil & gas", "power generation", "renewables", "utilities",
               "water", "environment services", "waste management",
               "water treatment"},
    "chemicals": {"industrial chemicals", "specialty chemicals",
                  "petrochemicals"},
    "mining": {"mining & minerals", "metals"},
    "tourism": {"hospitality", "tourism services", "entertainment"},
    "financial": {"banking", "capital markets", "insurance", "fintech"},
}
LEAF_TO_FAMILY = {leaf: fam for fam, leaves in TAXONOMY.items() for leaf in leaves}
ALL_LEAVES = sorted(LEAF_TO_FAMILY) + sorted(TAXONOMY)

SECTOR_SYNONYMS = {
    "industrial manufacturing": "industrial manufacturing",
    "industrial & logistics": "industrial manufacturing",
    "general industry": "industrial",
    "engineering & construction": "engineering & construction",
    "engineering": "engineering & construction",
    "ict": "ict",
    "ict hardware": "ict hardware",
    "information and communication technology": "ict",
    "electrical equipment": "electrical equipment",
    "medtech": "medical devices",
    "medical devices": "medical devices",
    "pharmaceutical": "pharmaceutical manufacturing",
    "pharmaceutical manufacturing": "pharmaceutical manufacturing",
    "pharma": "pharmaceutical manufacturing",
    "pharma & biotech": "pharmaceutical manufacturing",
    "biotechnology": "biotechnology",
    "healthcare": "healthcare",
    "healthcare and life sciences": "healthcare",
    "healthcare & life sciences": "healthcare",
    "oil, gas, energy & water": "energy",
    "oil & gas": "oil & gas",
    "energy": "energy",
    "environment services": "environment services",
    "environmental services": "environment services",
    "waste management": "waste management",
    "water treatment": "water treatment",
    "mining": "mining & minerals",
    "chemicals": "industrial chemicals",
    "tourism & quality of life & hospitality": "tourism",
    "tourism": "tourism",
    "hospitality": "hospitality",
    "financial services": "financial",
    "banking": "banking",
}

# symmetric cross-family investment affinity (industrial firms plausibly extend
# into ICT hardware assembly; chemicals feed pharma; etc.)
# Audit D3 (2026-07-28): lowered energy↔industrial so water contractors do not
# score as sector-identical to every industrial/environment pairing.
FAMILY_AFFINITY = {
    frozenset(("industrial", "ict")): 0.45,
    frozenset(("industrial", "healthcare")): 0.35,
    frozenset(("industrial", "energy")): 0.30,
    frozenset(("industrial", "chemicals")): 0.40,
    frozenset(("industrial", "mining")): 0.40,
    frozenset(("chemicals", "healthcare")): 0.55,
    frozenset(("energy", "chemicals")): 0.40,
    frozenset(("ict", "healthcare")): 0.40,
    frozenset(("mining", "chemicals")): 0.40,
    frozenset(("mining", "energy")): 0.35,
    frozenset(("ict", "energy")): 0.25,
    frozenset(("energy", "healthcare")): 0.15,
    frozenset(("ict", "chemicals")): 0.20,
    frozenset(("mining", "ict")): 0.15,
    frozenset(("mining", "healthcare")): 0.15,
    frozenset(("mining", "industrial")): 0.40,
    frozenset(("tourism", "industrial")): 0.15,
    frozenset(("tourism", "energy")): 0.10,
    frozenset(("tourism", "healthcare")): 0.20,
    frozenset(("financial", "ict")): 0.40,
    frozenset(("financial", "industrial")): 0.15,
}
BASE_CROSS_FAMILY = 0.10


def normalize_sector_label(raw: str) -> str:
    """Map a raw sector string to a taxonomy node via synonyms (fallback path;
    the enrichment step refines this from the full profile text)."""
    key = re.sub(r"\s+", " ", str(raw or "").strip().lower())
    if key in SECTOR_SYNONYMS:
        return SECTOR_SYNONYMS[key]
    if key in LEAF_TO_FAMILY or key in TAXONOMY:
        return key
    return ""


def _family(node: str) -> str:
    return node if node in TAXONOMY else LEAF_TO_FAMILY.get(node, "")


def resolve_sector_node(raw: str, enriched: str = "") -> str:
    """Prefer a taxonomy mapping from the raw sector label when enrichment
    collapses distinct sectors onto one node (audit D3). Same-family leaves
    stay distinct so Oil & Gas vs Environment Services scores 0.65, not 1.0."""
    raw_n = normalize_sector_label(raw)
    enriched_n = (enriched or "").strip().lower()
    if enriched_n in LEAF_TO_FAMILY or enriched_n in TAXONOMY:
        if not raw_n:
            return enriched_n
        if _family(raw_n) == _family(enriched_n):
            if raw_n in TAXONOMY and enriched_n in LEAF_TO_FAMILY:
                return enriched_n
            if enriched_n in TAXONOMY and raw_n in LEAF_TO_FAMILY:
                return raw_n
            if raw_n in LEAF_TO_FAMILY:
                return raw_n
            return enriched_n
        return raw_n
    return raw_n or enriched_n or ""


def sector_similarity(node_a: str, node_b: str) -> float:
    """Graded taxonomy similarity: leaf identity 1.0, parent-child 0.8,
    same-family siblings 0.65, cross-family via affinity table."""
    a, b = node_a or "", node_b or ""
    if not a or not b:
        return 0.30  # unknown: neutral, not zero
    if a == b:
        return 1.0
    fa, fb = _family(a), _family(b)
    if fa and fa == fb:
        if a == fa or b == fb:  # one is the family root
            return 0.80
        return 0.65
    if fa and fb:
        return FAMILY_AFFINITY.get(frozenset((fa, fb)), BASE_CROSS_FAMILY)
    return 0.15

# --------------------------- value-chain intelligence --------------------------

ROLES = ["Raw Material Supplier", "Component Supplier", "OEM",
         "Contract Manufacturer", "Technology Provider", "Platform Company",
         "Research Company", "Distributor", "System Integrator",
         "Service Provider", "Investor", "Developer"]

# required role -> {company role: compatibility}. Missing entries default 0.2;
# identical roles default 1.0.
ROLE_COMPAT = {
    "Contract Manufacturer": {"OEM": 0.85, "System Integrator": 0.60,
                              "Component Supplier": 0.50, "Technology Provider": 0.50,
                              "Developer": 0.40, "Raw Material Supplier": 0.30,
                              "Research Company": 0.30, "Service Provider": 0.30,
                              "Platform Company": 0.25, "Distributor": 0.20,
                              "Investor": 0.15},
    "OEM": {"Contract Manufacturer": 0.85, "Component Supplier": 0.55,
            "Technology Provider": 0.55, "System Integrator": 0.50,
            "Developer": 0.40, "Raw Material Supplier": 0.25,
            "Research Company": 0.30, "Distributor": 0.20, "Investor": 0.15},
    "Component Supplier": {"OEM": 0.70, "Contract Manufacturer": 0.70,
                           "Raw Material Supplier": 0.45, "Technology Provider": 0.50,
                           "System Integrator": 0.40},
    "Developer": {"Research Company": 0.90, "Platform Company": 0.60,
                  "Technology Provider": 0.60, "Contract Manufacturer": 0.45,
                  "OEM": 0.40, "Investor": 0.35, "Component Supplier": 0.25,
                  "Service Provider": 0.20, "Raw Material Supplier": 0.15,
                  "Distributor": 0.15},
    "Research Company": {"Developer": 0.85, "Technology Provider": 0.60,
                         "Platform Company": 0.50, "Contract Manufacturer": 0.35},
    "Technology Provider": {"Platform Company": 0.70, "Research Company": 0.60,
                            "System Integrator": 0.55, "OEM": 0.50,
                            "Developer": 0.50},
    "System Integrator": {"Technology Provider": 0.55, "OEM": 0.60,
                          "Service Provider": 0.50, "Contract Manufacturer": 0.55},
    "Raw Material Supplier": {"Component Supplier": 0.5},
}


def value_chain_score(required_roles: list, company_role: str,
                      secondary_role: str = "") -> float:
    """Best compatibility of the company's role(s) against the opportunity's
    required roles (ranked; later roles slightly discounted)."""
    if not required_roles or not company_role:
        return 0.30
    best = 0.0
    for i, need in enumerate(required_roles[:3]):
        discount = 1.0 - 0.1 * i
        for role in filter(None, [company_role, secondary_role]):
            if role == need:
                score = 1.0
            else:
                score = ROLE_COMPAT.get(need, {}).get(role, 0.20)
            best = max(best, score * discount)
    return round(best, 3)

# --------------------- business model + evidence calibration ---------------------

# Raw semantic similarity is percentile-ranked, so the best pair in the corpus
# lands near 1.0 whether or not the company actually makes the thing. The
# calibration below re-anchors both similarities on what the company IS
# (business model) and what it verifiably MAKES (evidenced products), so a
# component supplier can no longer score like the end-product manufacturer.

BUSINESS_MODELS = ["OEM", "Contract Manufacturer", "System Integrator",
                   "Technology Provider", "Component Supplier",
                   "Material Supplier", "Distributor", "Service Provider"]

# business model -> position in the supply hierarchy for product calibration
SUPPLY_LEVEL = {
    "OEM": "end", "Contract Manufacturer": "end",
    "System Integrator": "subsystem", "Technology Provider": "subsystem",
    "Component Supplier": "component",
    "Material Supplier": "raw", "Raw Material Supplier": "raw",
    "Distributor": "indirect", "Service Provider": "indirect",
}

# NOTE: most industrial companies are an OEM *of something*, so the business
# model alone cannot rank product fit (a cable OEM is not a 5G-equipment
# maker). Product calibration is therefore PER PAIR: the band depends on how
# the company's explicitly evidenced products relate to the opportunity's
# required end product (see product_evidence_level).

# closely-related (0.8) and partially-aligned (0.6) business-model pairs;
# anything else is indirect (0.4). Identical models cap at 1.0.
BM_CLOSE = {
    frozenset(("OEM", "Contract Manufacturer")): 0.80,
    frozenset(("System Integrator", "Technology Provider")): 0.80,
    frozenset(("Component Supplier", "Material Supplier")): 0.60,
    frozenset(("OEM", "System Integrator")): 0.60,
    frozenset(("OEM", "Technology Provider")): 0.60,
    frozenset(("OEM", "Component Supplier")): 0.60,
    frozenset(("Contract Manufacturer", "Component Supplier")): 0.60,
    frozenset(("Contract Manufacturer", "System Integrator")): 0.60,
    frozenset(("Technology Provider", "Service Provider")): 0.60,
    frozenset(("Component Supplier", "Distributor")): 0.60,
    frozenset(("Material Supplier", "Distributor")): 0.60,
    frozenset(("Distributor", "Service Provider")): 0.60,
}


def business_model_cap(company_bm: str, needed_bm: str) -> float:
    """Ceiling on profile_similarity from business-model compatibility.
    Identical models cap at 0.85 - BM match alone cannot unlock a perfect
    profile score (audit D2). Unknown models cannot be verified as a match."""
    if not company_bm or not needed_bm:
        return 0.70
    if company_bm == needed_bm:
        return 0.85
    return BM_CLOSE.get(frozenset((company_bm, needed_bm)), 0.40)


_GENERIC_TOKENS = {
    "the", "and", "for", "with", "using", "into", "from",
    "assembly", "assemblies", "manufacturing", "manufacture", "production",
    "hub", "site", "plant", "facility", "factory", "line",
    "equipment", "systems", "system", "products", "product", "solutions",
    "solution", "services", "service", "kits", "kit", "units", "unit",
    "smart", "advanced", "commercial", "industrial", "integration",
    "technology", "technologies", "grade", "high", "quality",
    "localized", "localization", "local", "partial", "portable",
}

# Category nouns that define a product family. Matching any of these between
# end_product and an evidenced line is enough for family evidence; covering
# all of them on one evidenced line is exact (audit M1).
_CATEGORY_NOUNS = {
    "vaccine", "glove", "catheter", "toothpaste", "ultrasound", "syringe",
    "endoscope", "dressing", "implant", "stent", "pacemaker", "insulin",
    "desalination", "filtration", "wastewater", "sewage", "recycling",
    "battery", "semiconductor", "turbine", "reactor", "sensor", "actuator",
    "robot", "robotics", "banking", "fintech", "cdn", "cloud", "storage",
    "learning", "lms", "diagnostic", "reagent", "api", "biologic",
    "biologics", "injectable", "anesthesia", "infusion", "pump", "lens",
    "contact", "glove", "nitrile", "latex",
}

# Alias map applied after light stemming (plurals → singular).
_TOKEN_ALIASES = {
    "vaccines": "vaccine", "glove": "glove", "gloves": "glove",
    "catheters": "catheter", "syringes": "syringe", "endoscopes": "endoscope",
    "dressings": "dressing", "implants": "implant", "stents": "stent",
    "batteries": "battery", "sensors": "sensor", "actuators": "actuator",
    "robots": "robot", "lenses": "lens", "pumps": "pump", "apis": "api",
    "reagents": "reagent", "diagnostics": "diagnostic", "turbines": "turbine",
    "reactors": "reactor", "biologic": "biologic", "biologics": "biologic",
    "injectables": "injectable", "toothpastes": "toothpaste",
    "ultrasounds": "ultrasound", "wastewaters": "wastewater",
    "nitrile": "glove", "latex": "glove",  # glove material → glove family
    # Well-known brand lines → category (audit M1 brand→category gaps)
    "sensodyne": "toothpaste", "parodontax": "toothpaste", "polident": "toothpaste",
    "colgate": "toothpaste", "aquafresh": "toothpaste", "oralb": "toothpaste",
}


def _stem_token(tok: str) -> str:
    """Light English plural stem + category aliases (audit M1)."""
    t = _TOKEN_ALIASES.get(tok, tok)
    if t in _TOKEN_ALIASES:
        t = _TOKEN_ALIASES[t]
    if t.endswith("ies") and len(t) > 4:
        t = t[:-3] + "y"
    elif t.endswith("ses") and len(t) > 4:
        t = t[:-2]
    elif t.endswith("s") and not t.endswith("ss") and len(t) > 3:
        t = t[:-1]
    return _TOKEN_ALIASES.get(t, t)


def _sig_tokens(text: str) -> set:
    raw = re.findall(r"[a-z0-9]+", str(text or "").lower())
    out = set()
    for t in raw:
        if len(t) <= 2 or t in _GENERIC_TOKENS:
            continue
        out.add(_stem_token(t))
    return out


def product_evidence_level(end_product: str, evidenced_products: list) -> int:
    """How the company's EXPLICITLY evidenced products relate to the
    opportunity's required end product, on distinctive tokens only:
      2 = exact: one evidenced product line covers the required end product
      1 = same family: substantial overlap (a directly supporting subsystem
          or the same product category)
      0 = no evidenced relation (the products may still be enabling inputs)
    Inference is never enough - only named products count.

    Audit M1: tokens are singularized and category nouns (vaccine/glove/…)
    grant family/exact credit even when brand names dominate the product line.
    """
    need = _sig_tokens(end_product)
    if not need:
        return 0
    need_cat = need & _CATEGORY_NOUNS
    best = 0
    for prod in evidenced_products or []:
        have = _sig_tokens(prod)
        if not have:
            continue
        inter = len(need & have)
        cov_need = inter / len(need)
        cov_min = inter / min(len(need), len(have))
        have_cat = have & _CATEGORY_NOUNS
        # Category-noun coverage: all required category nouns on one line → exact
        if need_cat and need_cat <= have:
            return 2
        if cov_need >= 0.99 or (inter >= 2 and cov_need >= 0.6):
            return 2
        if need_cat & have_cat:
            best = max(best, 1)
        if cov_need >= 0.30 or (inter >= 2 and cov_min >= 0.6):
            best = max(best, 1)
    return best


def calibrate_product_similarity(raw: float, business_model: str,
                                 evidence_level: int) -> float:
    """Map raw percentile similarity into the band the pair's EVIDENCE
    permits. >0.90 is reserved for evidenced exact-product makers; an
    end-product/subsystem maker in the same product family caps at 0.90; a
    maker or supplier of something else is an enabling input for THIS
    opportunity and caps at 0.80 (components) or lower (raw materials,
    distribution, services)."""
    level = SUPPLY_LEVEL.get(business_model, "")
    if evidence_level == 2:
        lo, hi = 0.60, 1.00
    elif level in ("end", "subsystem"):
        lo, hi = (0.25, 0.90) if evidence_level == 1 else (0.15, 0.80)
    elif level == "component":
        # exact evidence (handled above) is the only way past 0.80
        lo, hi = 0.15, 0.80
    elif level == "raw":
        lo, hi = 0.10, 0.55
    elif level == "indirect":
        lo, hi = 0.05, 0.50
    else:
        lo, hi = 0.15, 0.70  # unclassified: never allowed near a perfect score
    return round(lo + float(raw) * (hi - lo), 3)


# cap -> (floor, ceiling). Scaling INTO the band (not a hard min()) preserves
# ranking among pairs that share a ceiling - an audit of the first calibrated
# run found ~45% of rows tied exactly at their cap value, destroying the
# ordering information the semantic score carries.
PROFILE_BANDS = {
    0.85: (0.25, 0.85),  # identical business model (audit D2: was 1.00)
    0.80: (0.20, 0.80),  # closely related
    0.70: (0.10, 0.70),  # unknown/unclassified
    0.60: (0.15, 0.60),  # partially aligned
    0.40: (0.05, 0.40),  # indirect
}


def calibrate_profile_similarity(raw: float, company_bm: str,
                                 needed_bm: str) -> float:
    """Profile similarity cannot exceed what the business-model comparison
    supports: 1.0 identical, 0.8 closely related, 0.6 partially aligned,
    0.4 indirect. Raw percentile similarity is scaled into the band so
    ordering is preserved under the ceiling."""
    cap = business_model_cap(company_bm, needed_bm)
    lo, hi = PROFILE_BANDS.get(cap, (0.10, cap))
    return round(lo + float(raw) * (hi - lo), 3)

# --------------------------- corporate group detection ---------------------------

# Tokens that cannot identify a corporate family: legal forms, generic
# industry words, and geography. Everything else of length >=5 counts as a
# distinctive name token.
_GROUP_STOPWORDS = {
    # legal / corporate
    "gmbh", "limited", "companies", "company", "corporation", "holding",
    "holdings", "group", "incorporated", "ltd", "llc", "plc", "inc", "corp",
    "private", "public", "anonim", "anonima", "aktiengesellschaft", "ag",
    "sa", "nv", "bv", "co", "pty", "pvt",
    # German / Romance legal forms (incl. mojibake splits of beschränkter)
    "gesellschaft", "haftung", "beschrankter", "beschrnkter", "beschr",
    "nkter", "mit", "und", "der", "des", "sociedad", "limitada", "responsabilidad",
    "anonima", "societe", "anonyme", "besloten", "vennootschap",
    # generic industry words
    "industries", "industrial", "industry", "international", "engineering",
    "manufacture", "manufacturing", "equipment", "electric", "electrical",
    "electronics", "cable", "cables", "power",     "energy", "technology",
    "technologies", "solutions", "systems", "factory", "works", "automation",
    "controls", "development", "economic", "trading", "services", "general",
    "advanced", "motors", "machinery", "mechanical", "precision",
    "utilities", "utility",
    "pharma", "pharmaceutical", "pharmaceuticals", "chemical", "chemicals",
    "medical", "healthcare", "health", "financial", "finance", "banking",
    "insurance", "construction", "consulting", "consultancy", "consultants",
    "capital", "investment", "investments", "media", "entertainment",
    "education", "communications", "logistics", "aviation", "aerospace",
    "automobile", "motor", "motors", "steel", "petroleum", "business",
    "partners", "partner", "associates", "association", "institute",
    "university", "college", "academy", "global", "worldwide", "national",
    "security", "software", "digital", "design", "architecture", "architects",
    "hotels", "hospitality", "shipping", "telecom", "semiconductor",
    # common nouns that formed false families on the DB run (audit D4)
    "water", "fluid", "trent", "modern", "control", "railway", "science",
    "sciences", "black", "cloud", "instruments", "laboratories", "laboratory",
    "north", "south", "west", "eastern", "western", "center", "centre",
    "board", "asset", "assurance", "agency", "aircraft", "airways", "brands",
    "building", "bureau", "commercial", "computer", "creative", "credit",
    "defense", "delivery", "dental", "devices", "drilling", "economics",
    "electronic", "elite", "enterprise", "enterprises", "estate", "events",
    "excellence", "exchange", "executive", "export", "express", "fidelity",
    "foods", "forwarding", "future", "groupe", "guardian", "horizon",
    "human", "information", "integrated", "integrity", "intelligence",
    "lines", "machine", "marine", "maritime", "marketing", "material",
    "materials", "medicine", "metro", "micro", "mobile", "mobility",
    "monitor", "mountain", "mutual", "networks", "nuclear", "ocean",
    "office", "offshore", "oilfield", "packaging", "paints", "payment",
    "people", "perfect", "petrochemical", "phoenix", "press", "productions",
    "professional", "progressive", "projects", "property", "protection",
    "pumps", "quality", "research", "resorts", "resources", "robotics",
    "rubber", "safety", "savunma", "sharp", "smart", "sociedad", "solution",
    "sports", "staffing", "standard", "state", "stock", "store", "strategic",
    "strategy", "student", "studios", "summit", "swiss", "system", "talent",
    "technical", "therapeutics", "tires", "tobacco", "towers", "travel",
    "trinity", "truck", "trust", "tubes", "tyres", "union", "valves",
    "venture", "venue", "vision", "abstract", "access", "accuracy",
    # shared brand/common tokens that are not one corporate family
    "logic", "aspen", "stanley", "arzneimittel", "pharmacare",
    "telecommunications", "accreditation", "aktiebolag", "arthur", "asian",
    "bankasi", "turkiye", "continuing", "graduate",
    "berkeley", "berlin", "construcciones", "constructions", "council",
    "examiners", "import", "innovations", "little", "lectricit",
    "advisory", "alibaba", "alpha", "amazon", "appliances", "applied",
    "assessment", "atomic", "atlas", "baker", "banco", "baykar", "berhad",
    "biotec", "boost", "boston", "british", "caltex", "cambridge", "canon",
    "canvas", "carbon", "cengage", "centers", "central", "chartered",
    "chevron", "cirrus", "classin", "coaching", "compa", "compagnie",
    "compass", "consolidated", "contracting", "cooper", "corporate", "crane",
    "crown", "cultural", "daniel", "dassault", "deloitte", "delta",
    "deutschland", "diehl", "dominion", "doosan", "dornier", "douglas",
    "eastman", "eaton", "electronica", "elektronik", "energia", "engines",
    "farmaceutici", "ferrer", "filtrasyon", "fitch", "flowserve", "franklin",
    "fresenius", "gartner", "geely", "graduate", "grumman", "grupo",
    "guangxi", "haichang", "hanwha", "hatch", "havas", "helicopters",
    "higher", "hitachi", "hogan", "hughes", "hutchison", "hyosung", "hyundai",
    "imperial", "industrie", "insaat", "intco", "intercontinental", "jacobs",
    "james", "johnson", "jones", "kawasaki", "kerry", "kiewit", "kingsbury",
    "kintetsu", "kluwer", "knowledge", "kraft", "laboratoires", "leadership",
    "legal", "lexisnexis", "lloyd", "louis", "mahindra", "martin",
    "massachusetts", "maxar", "merck", "merrill", "midea", "mitsui", "moody",
    "morgan", "nagel", "nanoz", "nasional", "nielsen", "nihon", "nikkiso",
    "nobel", "novartis", "oculus", "ogilvy", "oracle", "orange", "oshkosh",
    "oxford", "pacific", "panasonic", "parker", "penta", "perkins", "philips",
    "phillips", "posco", "poste", "prudential", "prysmian", "rainbow",
    "reinhausen", "reinsurance", "reliance", "rheinmetall", "richard",
    "robert", "robinson", "rockwell", "roland", "sailun", "samsung", "sanofi",
    "schneider", "scientific", "shell", "siemens", "skillsoft", "statron",
    "strabag", "sutherland", "swire", "takeda", "tarek", "tetra", "textron",
    "torishima", "toyota", "turner", "veritas", "volvo", "washington",
    "western", "white", "williams", "yokohama",
    # geography / common place words
    "saudi", "arabia", "arabian", "china", "canada", "austria", "germany",
    "jeddah", "riyadh", "middle", "east", "gulf", "europe", "european",
    "asia", "zhejiang", "jiangsu", "shanghai", "wuhan", "emirates",
    "australia", "america", "american", "africa", "india", "indian",
    "japan", "korea", "france", "italy", "italia", "spain", "belgium",
    "switzerland", "singapore", "taiwan", "egypt", "london", "beijing",
    "shenzhen", "xiamen", "zhuhai",
}


def detect_corporate_groups(names) -> dict:
    """Map company name -> corporate group label for companies that share a
    distinctive name token (e.g. 'Namag China' / 'Zhejiang NAMAG Equipment
    Manufacturing' / 'Whiting Equipment Canada / Namag' -> 'Namag'). Groups
    are MARKED, not merged: regional entities of one family may genuinely be
    separate counterparts, but a shortlist should show they are one group.

    On large universes a frequency cap is required: tokens shared by more than
    a handful of companies ('Global', 'Pharmaceuticals', 'Consulting') are
    sector/legal words, not corporate families.
    """
    from collections import defaultdict
    names = list(names)
    tok2names = defaultdict(set)
    for n in names:
        for t in re.findall(r"[a-z0-9]+", str(n).lower()):
            if len(t) >= 5 and t not in _GROUP_STOPWORDS:
                tok2names[t].add(n)
    # Cap: real families in this registry are small (Namag=3, Statron=2).
    # Anything larger is almost always a shared industry/geo word.
    # Audit D4: tightened from 6 → 4 after Water/Fluid/Trent false families.
    max_members = 4
    groups = {}
    for t in sorted(tok2names):
        members = tok2names[t]
        if 2 <= len(members) <= max_members:
            for n in members:
                groups.setdefault(n, t.capitalize())
    return groups

# --------------------------- investment readiness ---------------------------

READINESS_DIMS = [
    "manufacturing_capability", "technology_ownership", "ip_intensity",
    "export_capability", "global_footprint", "localization_readiness",
    "regional_expansion", "gcc_presence", "greenfield_likelihood",
    "jv_potential", "partnership_potential", "rd_capability",
    "capital_capacity", "operational_maturity", "vision2030_alignment",
]
CORE_DIMS = ["manufacturing_capability", "technology_ownership", "ip_intensity",
             "export_capability", "global_footprint", "rd_capability",
             "capital_capacity", "operational_maturity"]
STRATEGIC_DIMS = ["jv_potential", "partnership_potential", "regional_expansion",
                  "vision2030_alignment"]
LOCALIZATION_DIMS = ["localization_readiness", "greenfield_likelihood",
                     "gcc_presence", "export_capability"]


def compose_readiness(dims: dict):
    def mean_of(keys):
        vals = [float(dims.get(k, 0.3)) for k in keys]
        return round(sum(vals) / len(vals), 3)
    return mean_of(CORE_DIMS), mean_of(STRATEGIC_DIMS), mean_of(LOCALIZATION_DIMS)

# ------------------------------- scoring model -------------------------------

# Analyst decision (2026-07-20): value-chain, readiness, strategic and
# localization scores are REPORTED but carry no weight in final_score - they
# are GPT-inferred from thin profiles, so weighting them rewards data
# availability rather than fit. The pair evidence (sector, profile, product)
# does all the positive scoring; the GPT-inferred layer acts only through
# subtractive penalties (which can never inflate a score) and the columns
# remain in the output for the analyst's eye. Weights are normalized at
# runtime, and any component can be re-enabled via --weights.
DEFAULT_WEIGHTS = {
    "sector": 0.20, "profile": 0.20, "product": 0.15, "value_chain": 0.0,
    "readiness": 0.0, "strategic": 0.0, "localization": 0.0,
}

# false-positive penalties: (name, predicate(row) -> bool, factor)
def compute_penalties(sector_sim, profile_sem, product_sem, vc_score,
                      company_role, required_roles) -> tuple:
    penalties = []
    if product_sem >= 0.70 and profile_sem < 0.45 and sector_sim < 0.40:
        penalties.append(("product_only_similarity", 0.65))
    if sector_sim < 0.25:
        penalties.append(("sector_mismatch", 0.75))
    if vc_score < 0.30:
        penalties.append(("value_chain_mismatch", 0.70))
    lead_need = (required_roles or [""])[0]
    if (company_role in ("Raw Material Supplier", "Distributor")
            and lead_need in ("Developer", "Research Company", "OEM")):
        penalties.append(("supplier_to_developer", 0.70))
    if (company_role in ("Investor", "Service Provider")
            and lead_need in ("Contract Manufacturer", "OEM")):
        penalties.append(("business_model_mismatch", 0.70))
    factor = 1.0
    for _, f in penalties:
        factor *= f
    return factor, [name for name, _ in penalties]


# Raised thresholds for the large DB universe (audit D1, 2026-07-28): the
# previous 0.72 Excellent cut put almost every gate-approved pair in Excellent.
TIERS = [(0.80, "Excellent Match"), (0.68, "Strong Match"), (0.55, "Good Match"),
         (0.42, "Potential Match"), (0.28, "Weak Match"), (0.0, "Poor Match")]
TIER_ORDER = [t for _, t in TIERS]

VETTED_TIERS = ("Excellent Match", "Strong Match", "Good Match")


SUPPLIER_ROLES = ("Component Supplier", "Raw Material Supplier", "Distributor")
BUILDER_ROLES = ("OEM", "Contract Manufacturer", "System Integrator",
                 "Technology Provider")


def match_type(decision: str, vc_score: float, loc_model: str,
               role: str = "", ev_level: int = 0,
               required_roles: list | None = None) -> str:
    """What KIND of lead this is - the label an IPA actually acts on.

    Audit D6: Anchor requires Excellent + role-exact VC fit + product evidence
    level ≥ 1 + company role matching a primary required builder role (or the
    first required role). Supplier roles never become anchors."""
    if decision in ("Weak Match", "Poor Match"):
        return "Not a target"
    required = required_roles or []
    primary = required[0] if required else ""
    role_fits_need = (
        (role and primary and role == primary)
        or (role in BUILDER_ROLES and (not required or role in required))
    )
    if (vc_score >= 0.95 and decision == "Excellent Match"
            and int(ev_level) >= 1 and role_fits_need
            and role not in SUPPLIER_ROLES):
        return "Anchor candidate"
    if role in SUPPLIER_ROLES or loc_model in ("Supplier localization",
                                               "Distribution partnership"):
        return "Supplier localization"
    if loc_model == "Joint venture" or (role in BUILDER_ROLES and vc_score >= 0.50) \
            or vc_score >= 0.70:
        return "JV partner"
    if vc_score >= 0.30:
        return "Supplier localization"
    return "Ecosystem player"


def opportunity_status(block_rows: list) -> str:
    """Honest per-opportunity verdict (restores v2's abstention capability).
    block_rows: [(decision, match_type), ...] for one opportunity."""
    vetted = [(d, m) for d, m in block_rows if d in VETTED_TIERS]
    if not vetted:
        return "No viable target in current universe"
    if any(m == "Anchor candidate" for _, m in vetted):
        return "Anchor candidate identified"
    return "No anchor in universe - JV/supplier options only"


def tier_for(score: float) -> str:
    for cut, name in TIERS:
        if score >= cut:
            return name
    return "Poor Match"


def cap_tier(tier: str, cap: str) -> str:
    return tier if TIER_ORDER.index(tier) >= TIER_ORDER.index(cap) else cap


def decide(final: float, gate: str, human: str, gated: bool,
           light: bool = False) -> str:
    """Six-tier decision. Analyst verdicts outrank the gate; the gate outranks
    the score. Depth of vetting bounds the tier: a single-vote (light) positive
    caps at "Potential Match" - that tier MEANS positively indicated but not
    fully vetted - and an unexamined pair cannot exceed it either. Only the
    full multi-vote gate can award Good Match and above."""
    if human == "Disagree":
        return "Poor Match"
    tier = tier_for(final)
    if human == "Agree":
        # analyst approval sets a FLOOR of Good Match
        return tier if TIER_ORDER.index(tier) <= TIER_ORDER.index("Good Match") else "Good Match"
    if gate == "No":
        return "Weak Match" if TIER_ORDER.index(tier) < TIER_ORDER.index("Weak Match") else tier
    if gate in ("Partial", "Direct", "Yes") and light:
        return ("Potential Match"
                if TIER_ORDER.index(tier) < TIER_ORDER.index("Potential Match") else tier)
    if gate == "Partial":
        return "Strong Match" if tier == "Excellent Match" else tier
    if gate in ("Direct", "Yes"):
        return tier
    # never examined at all
    return "Potential Match" if TIER_ORDER.index(tier) < TIER_ORDER.index("Potential Match") else tier


def confidence_score(comp_len, opp_len, class_conf, components, gate_agreement,
                     sector_sim: float = 1.0, penalized: bool = False,
                     evidence_quality: float = 0.5,
                     exact_product: bool = False,
                     ev_level: int = 0) -> int:
    """0-100, reflecting EVIDENCE QUALITY first. High (80-100) needs strong
    public evidence, a direct product match, and multiple agreeing signals;
    Medium (60-79) is a logical fit with some evidence and some assumptions;
    below 60 the pairing is mostly inferred.

    Audit D5: without product-family evidence (ev_level ≥ 1) the score is
    capped below the High band so long profiles cannot wallpaper High."""
    completeness = min(1.0, comp_len / 600) * 0.5 + min(1.0, opp_len / 1500) * 0.5
    vals = np.array(components, dtype=float)
    agreement = 1.0 - min(1.0, float(vals.std()) * 2.0)
    if "/" in str(gate_agreement):
        k, n = gate_agreement.split("/")
        vote = 0.55 if int(n) <= 1 else int(k) / max(1, int(n))
    else:
        vote = 0.5
    score = (0.20 * completeness + 0.15 * float(class_conf) + 0.15 * agreement
             + 0.15 * vote + 0.25 * float(evidence_quality)
             + 0.10 * (1.0 if int(ev_level) >= 1 else 0.0))
    if exact_product:
        score += 0.05
    if float(sector_sim) < 0.5:
        score -= 0.15
    if penalized:
        score -= 0.10
    score = min(1.0, max(0.0, score))
    # Hard ceiling: High requires at least same-family product evidence.
    if int(ev_level) < 1:
        score = min(score, 0.79)
    if int(ev_level) < 2 and not exact_product:
        score = min(score, 0.89)
    return int(round(100 * score))


def confidence_label(c: int) -> str:
    """High = strong evidence (80+); Medium = logical fit, some assumptions
    (60-79); Low = mostly inferred (<60)."""
    return "High" if c >= 80 else "Medium" if c >= 60 else "Low"


THIN_PROFILE_CHARS = 400


def apply_evidence_guards(decision: str, confidence: int, sector_sim: float,
                          ev_level: int, comp_len: int,
                          human_verdict: str = "") -> tuple:
    """Post-decision conservatism guards. Returns (possibly demoted decision,
    fired guard names). Analyst verdicts outrank the guards.

      sector_mismatch_cap     cross-family pair (sector_sim < 0.25) with zero
                              product evidence cannot exceed Weak Match.
      thin_profile_cap        <400 chars of profile text cannot reach vetted.
      low_confidence_demotion vetted tiers require confidence ≥ 60.
      exact_product_for_excellent  Excellent requires product_evidence_level ≥ 2
                              (audit D1/D2).
      family_product_for_strong    Strong requires product_evidence_level ≥ 1.
      family_product_for_good      Good requires product_evidence_level ≥ 1;
                              otherwise demote to Potential (explore band, audit M2).
    """
    if human_verdict in ("Agree", "Disagree"):
        return decision, []
    flags = []
    d = decision
    if (sector_sim < 0.25 and ev_level == 0
            and TIER_ORDER.index(d) < TIER_ORDER.index("Weak Match")):
        d = "Weak Match"
        flags.append("sector_mismatch_cap")
    if (comp_len < THIN_PROFILE_CHARS
            and TIER_ORDER.index(d) < TIER_ORDER.index("Potential Match")):
        d = "Potential Match"
        flags.append("thin_profile_cap")
    if d == "Excellent Match" and int(ev_level) < 2:
        d = "Strong Match" if int(ev_level) >= 1 else "Good Match"
        flags.append("exact_product_for_excellent")
    if d == "Strong Match" and int(ev_level) < 1:
        d = "Good Match"
        flags.append("family_product_for_strong")
    if d == "Good Match" and int(ev_level) < 1:
        d = "Potential Match"
        flags.append("family_product_for_good")
    if d in VETTED_TIERS and confidence < 60:
        d = "Potential Match"
        flags.append("low_confidence_demotion")
    return d, flags


def enforce_single_anchor(df: "pd.DataFrame") -> int:
    """Audit M4 / D6: at most one Anchor candidate per opportunity.
    Keep the highest-scoring Anchor; demote the rest to JV partner."""
    if "match_type" not in df.columns:
        return 0
    is_anchor = df["match_type"] == "Anchor candidate"
    if not is_anchor.any():
        return 0
    keep = (df[is_anchor]
            .sort_values(["opportunity_id", "final_score"],
                         ascending=[True, False], kind="mergesort")
            .groupby("opportunity_id", sort=False)
            .head(1)
            .index)
    demote = is_anchor & ~df.index.isin(keep)
    n = int(demote.sum())
    if not n:
        return 0
    df.loc[demote, "match_type"] = "JV partner"
    df.loc[demote, "evidence_flag"] = [
        (f + ";" if f else "") + "anchor_sibling_demoted"
        for f in df.loc[demote, "evidence_flag"].fillna("")
    ]
    return n


# Max Environment Services shortlist slots one company may occupy before later
# Environment opportunities prefer other names (audit M3 / D3).
MAX_ENV_SHORTLISTS_PER_COMPANY = 12


def select_export_indices(df: "pd.DataFrame", narrative_top: int,
                          max_env_per_company: int = MAX_ENV_SHORTLISTS_PER_COMPANY
                          ) -> "pd.Index":
    """Pick the export shortlist per opportunity. Non-Environment opps take the
    top-N by score. Environment Services opps fill top-N while capping how often
    the same company can appear across Environment shortlists, so SUEZ/Veolia
    cannot monopolize the sector export."""
    from collections import Counter
    selected = []
    env_counts: Counter = Counter()
    # Process higher-scoring Environment blocks first so the best fits keep slots.
    opp_best = df.groupby("opportunity_id")["final_score"].max()
    for oid in opp_best.sort_values(ascending=False).index:
        block = df[df["opportunity_id"] == oid].sort_values(
            "final_score", ascending=False, kind="mergesort")
        sector = str(block.iloc[0].get("opportunity_sector", "") or "").lower()
        is_env = "environment" in sector
        picked = []
        skipped = []
        for idx, row in block.iterrows():
            if len(picked) >= narrative_top:
                break
            if is_env and env_counts[row["company_name"]] >= max_env_per_company:
                skipped.append(idx)
                continue
            picked.append(idx)
            if is_env:
                env_counts[row["company_name"]] += 1
        # Backfill if the cap left the shortlist thin.
        for idx in skipped:
            if len(picked) >= narrative_top:
                break
            picked.append(idx)
        if len(picked) < narrative_top:
            for idx in block.index:
                if idx in picked:
                    continue
                picked.append(idx)
                if len(picked) >= narrative_top:
                    break
        selected.extend(picked)
    return pd.Index(selected)

# ------------------------------ gate persistence ------------------------------


def gate_cache_key(comp: "pd.Series", opp: "pd.Series", exemplars: str) -> str:
    """Hash of everything the gate prompt sees. Underscore-prefixed helper
    columns are transient and excluded."""
    payload = json.dumps(
        [{str(k): str(v) for k, v in comp.items() if not str(k).startswith("_")},
         {str(k): str(v) for k, v in opp.items() if not str(k).startswith("_")},
         RUBRIC_HASH, exemplars],
        sort_keys=True)
    return hashlib.sha1(payload.encode()).hexdigest()


def load_gate_cache(path: str = GATE_CACHE) -> dict:
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return {}


def save_gate_cache(cache: dict, path: str = GATE_CACHE) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(cache, fh)
    os.replace(tmp, path)


# ------------------------------- GPT enrichment -------------------------------

_cache_lock = threading.Lock()


def _load_cache() -> dict:
    try:
        with open(ENRICH_CACHE) as fh:
            return json.load(fh)
    except Exception:
        return {}


def _save_cache(cache: dict):
    os.makedirs(os.path.dirname(ENRICH_CACHE), exist_ok=True)
    with _cache_lock:
        payload = json.dumps(cache)
    tmp = ENRICH_CACHE + ".tmp"
    with open(tmp, "w") as fh:
        fh.write(payload)
    os.replace(tmp, ENRICH_CACHE)


def _chat_json(client, models, system, prompt):
    for model in models:
        try:
            resp = client.chat.completions.create(
                model=model, temperature=0.2,
                messages=[{"role": "system", "content": system},
                          {"role": "user", "content": prompt}])
            content = re.sub(r"^```(?:json)?|```$", "",
                             (resp.choices[0].message.content or "").strip()).strip()
            return json.loads(content)
        except Exception:
            continue
    return None


COMPANY_ENRICH_SYSTEM = (
    "You are an investment analyst classifying companies for FDI targeting. "
    "Judge ONLY from the text. Where the text gives no evidence for a dimension, "
    "score it 0.3 and lower classification_confidence; never invent facts. "
    "evidenced_products may contain ONLY products/services the text explicitly "
    "names - never products you infer the company could plausibly make. "
    "evidence_quality measures how much VERIFIABLE capability evidence the text "
    "contains (named products, facilities, certifications, customers, figures): "
    "0.9+ = specific and corroborated, 0.5 = generic claims, 0.2 = marketing "
    "copy with no checkable facts. "
    "SECTOR DISCIPLINE: pick the MOST SPECIFIC leaf that fits. Do NOT collapse "
    "Environment Services / waste / water treatment into oil & gas; do NOT map "
    "tourism or hospitality into energy or environment; do NOT map industrial "
    "logistics into environment services. Distinct sectors stay distinct.")


def company_enrich_prompt(comp) -> str:
    leaves = ", ".join(sorted(set(ALL_LEAVES)))
    roles = ", ".join(ROLES)
    models = ", ".join(BUSINESS_MODELS)
    dims = ", ".join(READINESS_DIMS)
    return f"""Classify this company. Return STRICT JSON only:
{{"normalized_sector": "<one of: {leaves}>",
  "value_chain_role": "<one of: {roles}>",
  "secondary_role": "<one of the roles or empty string>",
  "business_model": "<one of: {models} - what the company primarily IS, judged from what it demonstrably sells>",
  "evidenced_products": ["<up to 6 short phrases, ONLY products/services the text explicitly names>"],
  "evidence_quality": 0.0-1.0,
  "size_class": "SME|Mid|Large|Enterprise",
  "classification_confidence": 0.0-1.0,
  "readiness": {{<each of: {dims}> : 0.0-1.0}}}}

COMPANY
  Name: {comp['company_name']}
  Sector label: {comp['Sector']}
  Profile: {comp['company_profile']}
  Products/Services: {comp['product and Services']}
"""


OPP_ENRICH_SYSTEM = (
    "You are an investment analyst decomposing an investment opportunity. "
    "Judge only from the text; return strict JSON. "
    "SECTOR DISCIPLINE: pick the MOST SPECIFIC leaf. Environment Services, "
    "waste management and water treatment are NOT oil & gas. Keep tourism/"
    "hospitality and financial services out of energy and industrial leaves.")


def opp_enrich_prompt(opp) -> str:
    leaves = ", ".join(sorted(set(ALL_LEAVES)))
    roles = ", ".join(ROLES)
    models = ", ".join(BUSINESS_MODELS)
    return f"""What does this opportunity need? Return STRICT JSON only:
{{"normalized_sector": "<one of: {leaves}>",
  "required_roles": ["<up to 3 of: {roles}, ranked most-needed first>"],
  "business_model_needed": "<one of: {models} - the business model of the investor this opportunity primarily seeks>",
  "end_product": "<the exact product or system to be produced, one short phrase>",
  "stage_needed": "<short phrase for the value-chain stage sought>"}}

OPPORTUNITY
  Name: {opp['What is the opportunity name?']}
  Sector label: {opp['Sector']}
  Description: {opp['What is the opportunity description?']}
  Required materials: {opp['What materials are involved or required in the project?']}
  Value proposition: {opp['What is the value proposition of this opportunity?']}
"""


def enrich_all(client, models, companies, opps, workers=8):
    cache = _load_cache()

    def key_for(text):
        # v2: adds business_model / evidenced_products / evidence_quality
        # (companies) and business_model_needed / end_product (opportunities).
        return hashlib.md5(("enrichv3::" + text).encode()).hexdigest()

    def run_company(comp):
        k = key_for(str(comp["company_profile"]) + str(comp["product and Services"]))
        with _cache_lock:
            if k in cache:
                return comp["company_name"], cache[k]
        out = _chat_json(client, models, COMPANY_ENRICH_SYSTEM,
                         company_enrich_prompt(comp))
        if out is None:
            out = {"normalized_sector": normalize_sector_label(comp["Sector"]),
                   "value_chain_role": "", "secondary_role": "", "size_class": "",
                   "business_model": "", "evidenced_products": [],
                   "evidence_quality": 0.2,
                   "classification_confidence": 0.2, "readiness": {}}
        with _cache_lock:
            cache[k] = out
        return comp["company_name"], out

    def run_opp(opp):
        k = key_for(str(opp["What is the opportunity description?"])
                    + str(opp["What is the opportunity name?"]))
        with _cache_lock:
            if k in cache:
                return opp["What is the opportunity name?"], cache[k]
        out = _chat_json(client, models, OPP_ENRICH_SYSTEM, opp_enrich_prompt(opp))
        if out is None:
            out = {"normalized_sector": normalize_sector_label(opp["Sector"]),
                   "required_roles": ["Contract Manufacturer"],
                   "business_model_needed": "Contract Manufacturer",
                   "end_product": "", "stage_needed": ""}
        with _cache_lock:
            cache[k] = out
        return opp["What is the opportunity name?"], out

    with ThreadPoolExecutor(max_workers=workers) as ex:
        comp_list = [c for _, c in companies.iterrows()]
        opp_list = [o for _, o in opps.iterrows()]
        print(f"  enriching {len(comp_list)} companies...", flush=True)
        comp_enrich = {}
        done = 0
        for name, out in ex.map(run_company, comp_list):
            comp_enrich[name] = out
            done += 1
            if done % 50 == 0 or done == len(comp_list):
                print(f"    companies {done}/{len(comp_list)}", flush=True)
        # Persist after the company pool finishes so workers are not still
        # mutating the cache during json.dump (race caused a crash mid-run).
        _save_cache(cache)
        print(f"  enriching {len(opp_list)} opportunities...", flush=True)
        opp_enrich = {}
        done = 0
        for name, out in ex.map(run_opp, opp_list):
            opp_enrich[name] = out
            done += 1
            if done % 25 == 0 or done == len(opp_list):
                print(f"    opportunities {done}/{len(opp_list)}", flush=True)
    _save_cache(cache)
    return comp_enrich, opp_enrich

# ------------------------------- narratives ---------------------------------

NARRATIVE_SYSTEM = (
    "You are an experienced industrial strategy consultant writing conservative, "
    "evidence-based assessments for MISA - precision over recall, never an "
    "optimistic salesperson. Ground every claim in the given texts; name "
    "products, stages and gaps. A capability the texts do not state DOES NOT "
    "EXIST for your purposes: never assume certifications, telecom-grade "
    "qualification, RF or signal-integrity expertise, system-integration "
    "capability, or export capability. Where a relevant capability is not "
    "evidenced, write 'No public evidence was identified that demonstrates "
    "<capability>' instead of assuming it. Formulaic phrasing is a defect: if "
    "a sentence frame could be reused across many rows unchanged, rewrite it. "
    "BANNED everywhere: 'strong partner', 'reliable supplier', 'aligns well', "
    "'well-positioned', 'leveraging', 'expertise in', 'proven track record', "
    "'facilitate'.")

# Rotating structural directives - without them every field converges on one
# sentence skeleton across the file (e.g. 304/305 rows once began
# "Invest Saudi should facilitate...").
NARRATIVE_OPENERS = [
    "open fields with the opportunity requirement or value-chain stage at stake",
    "open fields with the company's most relevant named product or capability",
    "open fields with the decisive point: the strongest alignment or the decisive gap",
    "open fields with the demand, market or localization context",
]

# ASSIGNED variation beats requested variation: prompts asking the model to
# "vary" converge on a favorite anyway ("Initiate a technical..." held 39% of
# engagement lines; "No evidence of..." opened 21% of risks). Each row is
# therefore ASSIGNED its engagement verb and its leading risk lens by index,
# which bounds any single frame to len(bank) rotation.
ENGAGEMENT_VERBS = ["Commission", "Broker", "Convene", "Qualify",
                    "Structure", "Pilot", "Scope", "Invite"]
RISK_LENSES = [
    "the certification or regulatory gap",
    "the business-model or value-chain mismatch",
    "the missing product line or capability",
    "the market, footprint or geography constraint",
]
# The evidence rules pushed 211/305 executive summaries to open with a
# variant of "No evidence..." - a new formulaic skeleton. Same cure as the
# engagement verbs: ASSIGN the opening angle per row.
SUMMARY_OPENERS = [
    "open with the verdict and its single most decisive reason",
    "open with the company's most relevant evidenced product or capability",
    "open with the opportunity requirement or value-chain stage at stake",
    "open with the market, localization or portfolio context",
]


def _pair_seed_pick(salt: str, company: str, opportunity: str, options: list) -> str:
    """Pick a rotation option from a stable hash of the pair, not the loop
    index. Pre-rank indexing made adjacent shortlist rows share openers after
    re-ranking (audit A3); hashing by (company, opportunity) keeps variety
    within each shortlist regardless of sort order."""
    h = int(hashlib.sha1(f"{salt}|{company}|{opportunity}".encode()).hexdigest(), 16)
    return options[h % len(options)]

# Deterministic terminology glossary applied to every generated field: model
# text must use official names (a generated "Saudi FDA" reached a deliverable;
# the regulator is the SFDA).
TERM_GLOSSARY = [
    (re.compile(r"\bthe Saudi FDA\b"), "the SFDA"),
    (re.compile(r"\bSaudi FDA\b"), "SFDA"),
    (re.compile(r"\bSaudi Arabian FDA\b"), "SFDA"),
    (re.compile(r"\bSaudi Food and Drug Authority\b"), "Saudi Food and Drug Authority (SFDA)"),
    (re.compile(r"\bSaudi Food and Drug Authority \(SFDA\) \(SFDA\)"), "Saudi Food and Drug Authority (SFDA)"),
]


def normalize_terminology(text: str) -> str:
    out = str(text or "")
    for pat, repl in TERM_GLOSSARY:
        out = pat.sub(repl, out)
    return out


def narrative_prompt(comp, opp, decision, vc_role, required_roles,
                     business_model: str = "", evidenced_products: list = None,
                     end_product: str = "", exact_product: bool = False,
                     opener: str = "", verb: str = "", risk_lens: str = "",
                     summary_opener: str = "") -> str:
    opener_line = opener or "vary the opening of every field naturally"
    products_line = "; ".join(evidenced_products or []) or "none extracted from the texts"
    return f"""Write the investment assessment for this pairing. The decision is
already made: "{decision}". Company value-chain role: {vc_role or 'unknown'};
company business model: {business_model or 'not classified'};
the opportunity needs: {', '.join(required_roles or ['unknown'])}.

VERIFIED FACTS (the only established facts beyond the raw texts below):
- Products/services the company EXPLICITLY evidences: {products_line}
- The opportunity's required end product: {end_product or 'unspecified'}
- Evidence that the company makes that exact product: {'YES' if exact_product else 'NO'}

EVIDENCE RULES (violating any is a defect):
- Claim ONLY capabilities the company texts state. Certifications,
  telecom-grade qualification, RF/signal-integrity expertise, system
  integration, export capability: mention these ONLY if the texts evidence
  them. If a capability the opportunity needs is not evidenced, write
  "No public evidence was identified that demonstrates <capability>".
- Verb discipline: "manufactures", "integrates", "delivers" ONLY for
  capabilities the texts verify; for plausible-but-unverified links use
  "supports", "enables", "provides inputs for".
- Distinguish clearly: DIRECT capability match vs SUPPORTING capability vs
  ASSUMED capability - and never present an assumption as fact.
- Technical precision: never blur facility infrastructure, internal equipment
  components, telecom hardware, manufacturing equipment, and electronics
  assembly into one claim. Say which of these the evidence actually covers.

STYLE RULES (violating any is a defect):
- NEVER use these words/phrases: "expertise in", "leveraging", "leverage",
  "strong partner", "reliable supplier", "aligns well", "well-positioned",
  "proven track record", "extensive experience", "facilitate". Say what the
  company DOES and MAKES instead of characterizing its expertise.
- Ground every claim in the texts: name products, value-chain stages,
  materials, and market facts. A sentence that could be pasted into another
  company's assessment unchanged must be rewritten.
- Structure: {opener_line}. Do NOT open every field with the company name,
  and do not reuse one sentence skeleton across the fields.

Return STRICT JSON only:
{{"strengths": "2-3 sentences: ONLY demonstrated capabilities that genuinely match, citing named products and value-chain stages from the evidence. No assumed capabilities. Do NOT open with the company name - open with the capability or the requirement it meets",
  "risks": "2-3 sentences naming the decisive CAPABILITY GAPS relative to this opportunity (e.g. no evidence of required certifications, no OEM qualification, no subsystem integration capability, no export experience, commodity supplier rather than strategic technology partner, would require qualification before deployment) through DIFFERENT lenses. The FIRST sentence must state {{RISK_LENS}} as a concrete fact about this company (what it IS or MAKES and why that falls short). Any 'No public evidence was identified...' sentence belongs AFTER that opening sentence, never first. Do NOT open with 'The opportunity requires', 'The company', or ANY phrasing that starts with 'No' ('No evidence', 'No public evidence', 'No direct evidence')",
  "value_chain_position": "1-2 sentences: place the company at its exact stage of the chain (Raw Material -> Component Supplier -> Subsystem Supplier -> OEM -> System Integrator -> Operator/End Customer) and state the evidence for why it sits there; note where an upstream supplier still strengthens localization of this opportunity's chain",
  "recommended_engagement": "1-2 sentences in IMPERATIVE voice. The FIRST WORD must be '{{VERB}}'. The mechanism MUST match the company's demonstrated maturity: component/material suppliers and distributors get pilot supply agreements, technical validation or vendor qualification; OEMs/contract manufacturers get strategic partnership or joint manufacturing; technology companies get joint development, licensing or co-investment. Never recommend a partnership that exceeds demonstrated capability. Name the counterpart entities and the mechanism. NEVER begin with 'Invest Saudi'",
  "suggested_localization_model": "one of: Greenfield manufacturing | Regional assembly | Joint venture | Licensing and technology transfer | Supplier localization | Distribution partnership | Not recommended",
  "match_reason": ["3 factual reasons, each citing a DIFFERENT kind of evidence (product fit, value-chain position, market/footprint), each labelled as a direct match, supporting capability, or ecosystem contribution. Each reason MUST name at least one specific product, material, stage, facility or figure from the texts AND tie it to a named requirement of the opportunity. Abstract connectors ('complements the needs', 'supports objectives', 'provides a foundation', 'demonstrates readiness') are defects; none may start with 'The company'", "...", "..."],
  "profile_match_reason": "1-2 sentences justifying the profile_similarity value: how the company's BUSINESS MODEL ({business_model or 'unclassified'}) compares to what the opportunity seeks, plus what in its profile (identity, scale, sectors served, footprint) matches or fails to match, citing profile facts. Populated for every row",
  "product_match_reason": "1-2 sentences justifying the product_similarity value: name the specific EVIDENCED products/services that map to named opportunity requirements and state whether they constitute the exact end product, a subsystem, an enabling component, or an indirect input - or exactly which required products are missing. Populated for every row",
  "executive_summary": "2-3 sentences an investment manager reads first; conservative, specific, decisive; distinguish direct capability from supporting or assumed capability. Do NOT open with the company name and do NOT open with 'No evidence', 'No public evidence' or 'No direct' - {{SUMMARY_OPENER}}"}}

COMPANY
  Name: {comp['company_name']}
  Sector: {comp['Sector']}
  Profile: {comp['company_profile']}
  Products/Services: {comp['product and Services']}

OPPORTUNITY
  Name: {opp['What is the opportunity name?']}
  Sector: {opp['Sector']}
  Description: {opp['What is the opportunity description?']}
  Highlights: {opp['What are the investment highlights?']}
  Required materials: {opp['What materials are involved or required in the project?']}
""".replace("{VERB}", verb or "Commission").replace(
        "{RISK_LENS}", risk_lens or "the decisive capability gap").replace(
        "{SUMMARY_OPENER}", summary_opener or "open with the verdict logic or the decisive fact")


LOCALIZATION_MENU = ["Greenfield manufacturing", "Regional assembly",
                     "Joint venture", "Licensing and technology transfer",
                     "Supplier localization", "Distribution partnership",
                     "Not recommended"]


def normalize_localization(value: str, decision: str) -> str:
    """Coerce a free-text localization answer onto the fixed menu. The model
    occasionally answers with something else (e.g. a value-chain role); an
    off-menu value falls back deterministically by decision tier."""
    v = str(value or "").strip().lower()
    for item in LOCALIZATION_MENU:
        if item.lower() == v or item.lower() in v or (v and v in item.lower()):
            return item
    if "not recommend" in v:
        return "Not recommended"
    positive = decision in ("Excellent Match", "Strong Match", "Good Match")
    return "Supplier localization" if positive else "Not recommended"


def generate_narrative(client, models, comp, opp, decision, vc_role,
                       required_roles, business_model: str = "",
                       evidenced_products: list = None, end_product: str = "",
                       exact_product: bool = False, opener: str = "",
                       verb: str = "", risk_lens: str = "",
                       summary_opener: str = ""):
    out = _chat_json(client, models, NARRATIVE_SYSTEM,
                     narrative_prompt(comp, opp, decision, vc_role, required_roles,
                                      business_model=business_model,
                                      evidenced_products=evidenced_products,
                                      end_product=end_product,
                                      exact_product=exact_product,
                                      opener=opener, verb=verb, risk_lens=risk_lens,
                                      summary_opener=summary_opener))
    if not isinstance(out, dict):
        out = {}
    reasons = out.get("match_reason", [])
    if not isinstance(reasons, list):
        reasons = [str(reasons)]
    reasons = [str(r).strip() for r in reasons if str(r).strip()][:3]
    reasons = [normalize_terminology(r) for r in reasons]
    return {
        "strengths": normalize_terminology(str(out.get("strengths", "")).strip()),
        "risks": normalize_terminology(str(out.get("risks", "")).strip()),
        "value_chain_position": normalize_terminology(
            str(out.get("value_chain_position", "")).strip()),
        "recommended_engagement": normalize_terminology(
            str(out.get("recommended_engagement", "")).strip()),
        "suggested_localization_model": normalize_localization(
            out.get("suggested_localization_model", ""), decision),
        "match_reason": json.dumps(reasons, ensure_ascii=False) if reasons else "",
        "profile_match_reason": normalize_terminology(
            str(out.get("profile_match_reason", "")).strip()),
        "product_match_reason": normalize_terminology(
            str(out.get("product_match_reason", "")).strip()),
        "executive_summary": normalize_terminology(
            str(out.get("executive_summary", "")).strip()),
    }

# ----------------------------------- main -----------------------------------

COLUMNS = [
    "company_id", "company_name", "corporate_group",
    "opportunity_id", "opportunity_name",
    "opportunity_status",
    "company_sector", "normalized_sector", "opportunity_sector",
    "sector_similarity", "profile_similarity", "product_similarity",
    "profile_match_reason", "product_match_reason",
    "value_chain_role", "business_model", "value_chain_score",
    "value_chain_position",
    "investment_readiness_score", "strategic_fit_score",
    "localization_score", "ai_score", "confidence_score", "decision",
    "human_verdict", "evidence_flag",
    "match_type", "final_score", "rank", "strengths", "risks",
    "recommended_engagement", "suggested_localization_model", "match_reason",
    "executive_summary",
]


def write_summary(out: pd.DataFrame, companies: pd.DataFrame,
                  opps: pd.DataFrame, opp_enrich: dict | None = None,
                  path: str = "Output/matching_summary_v3.md",
                  gate_flips: list | None = None):
    """One-page dataset verdict an investment manager reads first."""
    comp_secs = companies["Sector"].value_counts()
    opp_secs = opps["Sector"].value_counts()
    statuses = out.drop_duplicates("opportunity_id")[["opportunity_name", "opportunity_status"]]
    n_anchor = int((statuses["opportunity_status"] == "Anchor candidate identified").sum())
    n_none = int((statuses["opportunity_status"] == "No viable target in current universe").sum())
    pursue = out[out["ai_score"] == 1]
    lines = [
        "# Matching run: dataset verdict", "",
        f"Companies: {companies['company_name'].nunique()} "
        f"({', '.join(f'{k} {v}' for k, v in comp_secs.items())})",
        f"Opportunities: {len(opps)} "
        f"({', '.join(f'{k} {v}' for k, v in opp_secs.items())})", "",
        "## The core finding", "",
        f"The company universe is a supplier and industrial registry; the "
        f"opportunities are builds in {', '.join(opp_secs.index)}. "
        f"Anchor candidates identified: {n_anchor} of {len(opps)} opportunities. "
        f"The vetted matches are JV-partner and supplier-localization plays, "
        f"not anchor investors.", "",
        "Recommendation: source anchor prospects externally per vertical "
        "(telecom OEM/EMS players for the ICT hardware builds; imaging and "
        "device OEMs for MedTech; API and biologics producers for pharma), "
        "and use this roster as the local supply-chain and JV layer it "
        "actually is.", "",
        "## Per-opportunity status", "",
    ]
    for _, r in statuses.iterrows():
        lines.append(f"- {r['opportunity_name']}: {r['opportunity_status']}")
    if opp_enrich:
        lines += ["", "## Anchor sourcing criteria (for external prospecting)", ""]
        no_anchor = statuses[statuses["opportunity_status"] != "Anchor candidate identified"]
        for _, r in no_anchor.iterrows():
            oe = opp_enrich.get(r["opportunity_name"], {})
            roles = ", ".join(oe.get("required_roles", []) or ["-"])
            lines.append(f"- {r['opportunity_name']}: seek a {roles} in "
                         f"{oe.get('normalized_sector', '-')}"
                         + (f"; stage: {oe.get('stage_needed')}" if oe.get("stage_needed") else ""))
    # Concentration view (audit fix F5): who leads how many shortlists, and
    # which "separate" candidates are actually one corporate family.
    leads = out[out["rank"] == 1]["company_name"].value_counts()
    multi = leads[leads >= 2]
    if len(multi):
        lines += ["", "## Concentration", "",
                  f"{len(multi)} compan{'ies' if len(multi) > 1 else 'y'} lead "
                  f"{int(multi.sum())} of {out['opportunity_id'].nunique()} shortlists - "
                  "a universe-composition signal, not a scoring artifact:", ""]
        for name, n in multi.items():
            lines.append(f"- {name}: top candidate for {n} opportunities")
    if "corporate_group" in out.columns:
        fams = (out[out["corporate_group"] != ""]
                .drop_duplicates("company_name")
                .groupby("corporate_group")["company_name"].apply(list))
        if len(fams):
            lines += ["", "Corporate families appearing as multiple candidates "
                          "(marked in the corporate_group column):", ""]
            for g, members in fams.items():
                lines.append(f"- {g}: {', '.join(members)}")
    if gate_flips:
        lines += ["", "## Gate verdict changes vs previous run", "",
                  "These pairs were re-voted because their inputs (texts, rubric "
                  "or analyst precedents) changed, and the verdict moved:", ""]
        for f in gate_flips:
            lines.append(f"- {f['company']} -> {f['opportunity']}: "
                         f"{f['previous']} => {f['new']}")
    lines += ["", "## Pursue list", ""]
    for _, r in pursue.iterrows():
        hv = str(r.get("human_verdict", "") or "").strip()
        analyst = f", analyst {hv}" if hv else ""
        lines.append(f"- {r['company_name']} -> {r['opportunity_name']}: "
                     f"{r['decision']}, {r['match_type']}, "
                     f"score {r['final_score']}, confidence {r['confidence_score']}"
                     f"{analyst}")
    with open(path, "w") as fh:
        fh.write("\n".join(lines) + "\n")
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--no-openai", action="store_true")
    ap.add_argument("--require-openai", action="store_true")
    ap.add_argument("--embed-blend", type=float, default=0.3)
    ap.add_argument("--chat-provider", choices=["auto", "azure", "public"], default="auto")
    ap.add_argument("--gpt-votes", type=int, default=3)
    ap.add_argument("--no-escalate", action="store_true")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--top-n", type=int, default=5,
                    help="full multi-vote gate depth per opportunity "
                         "(should cover the export slice; raised to "
                         "--narrative-top when lower)")
    ap.add_argument("--narrative-top", type=int, default=5,
                    help="exported / narrated rows per opportunity")
    ap.add_argument("--no-narratives", action="store_true")
    ap.add_argument("--weights", default=None, help="JSON file overriding scoring weights")
    ap.add_argument("--human-reviews", default="Data/human_reviews.csv")
    ap.add_argument("--env-file", default=None)
    ap.add_argument("--source", choices=["db", "excel"], default="db",
                    help="load companies/opportunities from Postgres (default) or Excel")
    ap.add_argument("--limit-companies", type=int, default=None,
                    help="optional cap on companies loaded from the DB")
    ap.add_argument("--limit-opportunities", type=int, default=None,
                    help="optional cap on opportunities loaded from the DB")
    ap.add_argument("--no-db", action="store_true",
                    help="skip upserting results into the matchmaking F database")
    ap.add_argument("--replace-matches", action="store_true",
                    help="delete existing model_version=v3 MatchingOutput rows before upsert")
    ap.add_argument("--fresh-gate", action="store_true",
                    help="ignore the gate verdict cache and re-vote every pair")
    args = ap.parse_args()
    # Exported rows must receive the full panel, not the 1-vote light path -
    # otherwise a cached 3/3 Direct on rank 4-5 is wrongly capped at Potential.
    if args.top_n < args.narrative_top:
        print(f"Raising --top-n from {args.top_n} to {args.narrative_top} "
              f"so the export slice is fully gated.")
        args.top_n = args.narrative_top

    try:
        from dotenv import load_dotenv
        load_dotenv(".env")
        if args.env_file:
            load_dotenv(args.env_file, override=True)
    except ImportError:
        pass

    weights = dict(DEFAULT_WEIGHTS)
    if args.weights:
        with open(args.weights) as fh:
            weights.update(json.load(fh))
    wsum = sum(weights.values())
    weights = {k: v / wsum for k, v in weights.items()}

    backends = resolve_backends(args)
    chat_client, chat_models = backends["chat_client"], backends["chat_models"]
    if chat_client is None:
        sys.exit("FATAL: v3 requires a chat backend (enrichment + gate).")

    if args.source == "db":
        from load_to_db_v3 import load_companies_from_db, load_opportunities_from_db
        companies = load_companies_from_db(limit=args.limit_companies)
        opps = load_opportunities_from_db(limit=args.limit_opportunities)
        # Opportunity-centric export: top-N per opportunity (not per company),
        # so a 3k-company universe does not explode narrative / light-gate cost.
        export_by = "opportunity"
    else:
        companies = load_companies()
        opps = load_opportunities()
        export_by = "company"

    human = load_human_reviews(args.human_reviews)
    print(f"Loaded {len(companies)} companies, {len(opps)} opportunities "
          f"(source={args.source}), {len(human)} analyst verdicts.")
    groups = detect_corporate_groups(companies["company_name"])
    if groups:
        fams = {}
        for name, g in groups.items():
            fams.setdefault(g, []).append(name)
        print(f"Corporate groups detected: "
              + "; ".join(f"{g} ({len(ns)})" for g, ns in sorted(fams.items())))

    prof_mat, prod_mat, opp_mat, mode = build_vectors(companies, opps, args, backends)
    print(f"Embedding backend: {mode.upper()}")
    from matching_v2 import cosine_matrix
    sim_profile = cosine_matrix(prof_mat, opp_mat)
    sim_product = cosine_matrix(prod_mat, opp_mat)
    pct_profile = percentile_rank(sim_profile)
    pct_product = percentile_rank(sim_product)
    spec_profile = percentile_rank(sim_profile - sim_profile.mean(axis=1, keepdims=True))
    spec_product = percentile_rank(sim_product - sim_product.mean(axis=1, keepdims=True))
    sem_profile = (1 - SPECIFICITY_BLEND) * pct_profile + SPECIFICITY_BLEND * spec_profile
    sem_product = (1 - SPECIFICITY_BLEND) * pct_product + SPECIFICITY_BLEND * spec_product

    print("Enriching companies and opportunities (cached GPT classification)...")
    comp_enrich, opp_enrich = enrich_all(chat_client, chat_models, companies, opps,
                                         workers=args.workers)

    opp_names = opps["What is the opportunity name?"].tolist()
    has_db_ids = "db_id" in companies.columns and "db_id" in opps.columns
    rows = []
    # enumerate so matrix indices are always 0..n-1 even if the frame index
    # is not a RangeIndex (db_id values must never be used as matrix coords).
    for i, (_, comp) in enumerate(companies.iterrows()):
        ce = comp_enrich.get(comp["company_name"], {})
        c_node = resolve_sector_node(
            comp["Sector"], ce.get("normalized_sector") or "")
        c_role = ce.get("value_chain_role", "")
        c_role2 = ce.get("secondary_role", "")
        c_bm = str(ce.get("business_model", "") or "")
        c_products = [str(p) for p in (ce.get("evidenced_products") or [])]
        c_evq = float(ce.get("evidence_quality", 0.4) or 0.4)
        dims = ce.get("readiness", {}) or {}
        readiness, strategic, localization = compose_readiness(dims)
        class_conf = float(ce.get("classification_confidence", 0.3) or 0.3)
        comp_len = len(str(comp["company_profile"])) + len(str(comp["product and Services"]))
        company_pk = int(comp["db_id"]) if has_db_ids else (i + 1)

        for j, (_, opp) in enumerate(opps.iterrows()):
            oe = opp_enrich.get(opp_names[j], {})
            o_node = resolve_sector_node(
                opp["Sector"], oe.get("normalized_sector") or "")
            required = oe.get("required_roles", []) or []
            o_bm = str(oe.get("business_model_needed", "") or "")
            end_product = str(oe.get("end_product", "") or "")
            s_sim = sector_similarity(c_node, o_node)
            vc = value_chain_score(required, c_role, c_role2)
            # evidence-based calibration: raw percentile similarity is bounded
            # by what the company's business model and evidenced products
            # actually support (see calibrate_* docstrings).
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
            opportunity_pk = int(opp["db_id"]) if has_db_ids else (j + 1)
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
    df["rank"] = (df.groupby("company_id")["final_score"]
                  .rank(method="first", ascending=False).astype(int))
    df["rank_for_opp"] = (df.groupby("opportunity_id")["final_score"]
                          .rank(method="first", ascending=False).astype(int))

    # Export shortlist: Environment Services applies a per-company concentration
    # cap so a few operators cannot fill every Environment slot (audit M3).
    if export_by == "opportunity":
        export_idx = select_export_indices(df, args.narrative_top)
        df["_export"] = df.index.isin(export_idx)
        n_env_swap = int(
            ((df["rank_for_opp"] <= args.narrative_top) & ~df["_export"]).sum())
        if n_env_swap:
            print(f"Environment diversity: replaced {n_env_swap} concentrated "
                  f"shortlist slots (cap {MAX_ENV_SHORTLISTS_PER_COMPANY}/company).")
    else:
        df["_export"] = df["rank"] <= args.narrative_top

    # graded gate on top-N per opportunity (reuses v2 gate + exemplars + drift)
    exemplar_pairs = build_exemplar_lines(human, companies)
    prior = load_prior_verdicts()
    df["gate"] = ""
    df["gate_agreement"] = ""
    df["gate_depth"] = ""
    # Full-gate the score top-N and every exported row (diversity may pull
    # deeper Environment candidates into the ship set).
    todo = df[(df["rank_for_opp"] <= args.top_n) | df["_export"]]
    print(f"Gate: validating {len(todo)} pairs ({args.gpt_votes}-vote)...")

    gate_cache = {} if args.fresh_gate else load_gate_cache()
    _gate_lock = threading.Lock()
    gate_stats = {"reused": 0, "voted": 0}

    def _voted_or_cached(row, votes, escalate):
        """Reuse a persisted verdict when the gate inputs are unchanged and the
        cached verdict was decided on at least `votes` samples; otherwise vote
        and persist."""
        lines = [l for p, l in exemplar_pairs
                 if p != (row["company_name"], row["opportunity_name"])][-8:]
        exemplars = "\n".join(lines)
        comp, opp_row = companies.iloc[row["_i"]], opps.iloc[row["_j"]]
        key = gate_cache_key(comp, opp_row, exemplars)
        with _gate_lock:
            cached = gate_cache.get(key)
        if cached and cached.get("votes", 0) >= votes:
            with _gate_lock:
                gate_stats["reused"] += 1
            return (cached["fit"], cached.get("confidence", 0.0), "",
                    cached.get("model"), cached["agreement"])
        fit, conf, expl, model, agree = gpt_validate(
            chat_client, chat_models, comp, opp_row,
            votes=votes, escalate=escalate, exemplars=exemplars)
        if fit != "Not Run":
            n_samples = (int(str(agree).split("/")[1])
                         if "/" in str(agree) else votes)
            with _gate_lock:
                gate_stats["voted"] += 1
                gate_cache[key] = {
                    "fit": fit, "agreement": agree, "confidence": conf,
                    "model": model, "votes": max(votes, n_samples),
                    "company": row["company_name"],
                    "opportunity": row["opportunity_name"],
                    "rubric": RUBRIC_HASH,
                    "ts": datetime.now(timezone.utc).isoformat(),
                }
        return fit, conf, expl, model, agree

    def _gate(item):
        idx, row = item
        return idx, _voted_or_cached(row, args.gpt_votes, not args.no_escalate)

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        for idx, (fit, conf, expl, model, agree) in ex.map(_gate, list(todo.iterrows())):
            df.at[idx, "gate"] = fit
            df.at[idx, "gate_agreement"] = agree
            df.at[idx, "gate_depth"] = "full"

    # Light gate for every remaining EXPORTED row (single vote): without this,
    # the long tail was never examined and sat in "Potential Match", which reads
    # as an endorsement. Every row the file ships now carries a real verdict.
    export_mask = df["_export"]
    light = df[export_mask & (df["gate"] == "")]
    if len(light):
        print(f"Light gate (1-vote) for {len(light)} remaining exported rows...")

        def _light(item):
            idx, row = item
            return idx, _voted_or_cached(row, 1, False)

        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            for idx, (fit, conf, expl, model, agree) in ex.map(_light, list(light.iterrows())):
                df.at[idx, "gate"] = fit
                df.at[idx, "gate_agreement"] = agree
                # Cached full-panel verdicts must keep full depth - otherwise a
                # reused 3/3 Partial is wrongly capped at Potential Match.
                n_votes = (int(str(agree).split("/")[1])
                           if "/" in str(agree) else 1)
                df.at[idx, "gate_depth"] = (
                    "full" if n_votes >= args.gpt_votes else "light")

    save_gate_cache(gate_cache)
    print(f"Gate persistence: {gate_stats['reused']} verdicts reused from cache, "
          f"{gate_stats['voted']} freshly voted.")

    labels = [{"ts": datetime.now(timezone.utc).isoformat(),
               "company": r.company_name, "opportunity": r.opportunity_name,
               "decision": r.gate, "confidence": 0.0, "agreement": r.gate_agreement,
               "model": "v3",
               "votes": (int(str(r.gate_agreement).split("/")[1])
                         if "/" in str(r.gate_agreement) else args.gpt_votes),
               "rubric": RUBRIC_HASH,
               "final_score": r.final_score, "embed_mode": mode}
              for r in df.itertuples() if r.gate]
    if labels:
        os.makedirs(os.path.dirname(LABELS_JSONL), exist_ok=True)
        with open(LABELS_JSONL, "a") as fh:
            for item in labels:
                fh.write(json.dumps(item) + "\n")
    flip_rows = [
        {"company": r.company_name, "opportunity": r.opportunity_name,
         "previous": prior[(r.company_name, r.opportunity_name)]["decision"],
         "new": r.gate}
        for r in df.itertuples()
        if r.gate and (r.company_name, r.opportunity_name) in prior
        and prior[(r.company_name, r.opportunity_name)].get("decision")
        not in ("", None, r.gate)]
    print(f"Gate verdicts recorded: {len(labels)}; changed vs prior: {len(flip_rows)}.")
    for f in flip_rows:
        print(f"  FLIP: {f['company']} -> {f['opportunity']}: "
              f"{f['previous']} => {f['new']}")

    # decisions, confidence
    df["human_verdict"] = [
        {1: "Agree", 0: "Disagree"}.get(human.get((r.company_name, r.opportunity_name), -1), "")
        for r in df.itertuples()]
    decisions, confidences, ai_scores, evidence_flags = [], [], [], []
    # iterrows, not itertuples: underscore-prefixed helper columns are renamed
    # positionally by itertuples and become unreachable by name.
    for _, r in df.iterrows():
        # Prefer agreement panel size over gate_depth: a reused 3/3 verdict is
        # full-depth even when it arrived via the light-gate code path.
        agree = str(r["gate_agreement"] or "")
        if "/" in agree:
            light = int(agree.split("/")[1]) < args.gpt_votes
        else:
            light = (r["gate_depth"] == "light")
        d = decide(r["final_score"], r["gate"], r["human_verdict"], bool(r["gate"]),
                   light=light)
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
                                          int(r["_ev_level"]), int(r["_comp_len"]),
                                          r["human_verdict"])
        decisions.append(d)
        confidences.append(f"{c} ({confidence_label(c)})")
        ai_scores.append(1 if TIER_ORDER.index(d) <= TIER_ORDER.index("Good Match") else 0)
        evidence_flags.append(";".join(guards))
    df["decision"] = decisions
    df["confidence_score"] = confidences
    df["ai_score"] = ai_scores
    df["evidence_flag"] = evidence_flags
    n_guarded = int((df["evidence_flag"].str.len() > 0).sum())
    if n_guarded:
        print(f"Evidence guards demoted {n_guarded} rows "
              f"({df[df['evidence_flag'] != '']['evidence_flag'].str.split(';').explode().value_counts().to_dict()}).")

    # narratives for the export slice
    out_rows = df[export_mask].copy()
    for k in ["strengths", "risks", "value_chain_position",
              "recommended_engagement",
              "suggested_localization_model", "match_reason", "executive_summary",
              "profile_match_reason", "product_match_reason"]:
        out_rows[k] = ""
    if not args.no_narratives:
        print(f"Narratives for {len(out_rows)} rows...")
        done = [0]

        def _narr(item):
            idx, row = item
            # companies/opps are RangeIndexed after loaders; _i/_j are positions.
            g = generate_narrative(chat_client, chat_models,
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
            done[0] += 1
            if done[0] % 25 == 0 or done[0] == len(out_rows):
                print(f"  {done[0]}/{len(out_rows)}", flush=True)
            return idx, g

        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            for idx, g in ex.map(_narr, list(out_rows.iterrows())):
                for k, v in g.items():
                    out_rows.at[idx, k] = v

    # Engagement guidance only where engagement makes sense (analyst decision
    # 2026-07-21): rejected rows keep their risks and summary (the why-not) but
    # carry no engagement plan.
    rejected = out_rows["decision"].isin(["Weak Match", "Poor Match"])
    out_rows.loc[rejected, "recommended_engagement"] = ""
    out_rows.loc[rejected, "suggested_localization_model"] = "Not recommended"

    # Match type + honest per-opportunity status (independent-review fixes):
    # the tier says how good the fit is, match_type says what the fit IS, and
    # opportunity_status restores abstention - an opportunity with no vetted
    # target says so instead of crowning the least-bad supplier.
    out_rows["value_chain_role"] = out_rows["_role"]
    out_rows["business_model"] = out_rows["_bm"]
    out_rows["match_type"] = [
        match_type(r["decision"], float(r["value_chain_score"]),
                   r["suggested_localization_model"], r["_role"],
                   ev_level=int(r["_ev_level"]),
                   required_roles=r["_required"] if isinstance(r["_required"], list)
                   else [])
        for _, r in out_rows.iterrows()]
    n_anchor_demote = enforce_single_anchor(out_rows)
    if n_anchor_demote:
        print(f"Anchor demotions: {n_anchor_demote} co-anchors → JV partner "
              f"(one Anchor per opportunity).")
    status_by_opp = {
        oid: opportunity_status(list(zip(g["decision"], g["match_type"])))
        for oid, g in out_rows.groupby("opportunity_id")}
    out_rows["opportunity_status"] = out_rows["opportunity_id"].map(status_by_opp)

    # Ranking (analyst decisions 2026-07-21): rank is PER OPPORTUNITY and
    # expresses PURSUE PRIORITY - decision tier first, then final_score - so a
    # vetted Strong Match always outranks a higher-scoring but gate-rejected
    # Weak Match inside its block. Blocks are ordered by their best row.
    # Corporate-group siblings (audit fix): only the family's best row keeps
    # its natural position; the rest sink below all unaffiliated candidates so
    # one family cannot occupy multiple shortlist slots. Demoted rows stay in
    # the file, flagged group_sibling_demoted.
    out_rows["_tier"] = out_rows["decision"].map({t: i for i, t in enumerate(TIER_ORDER)})
    out_rows = out_rows.sort_values(["opportunity_id", "_tier", "final_score"],
                                    ascending=[True, True, False],
                                    kind="mergesort")
    out_rows["_dup_sibling"] = ((out_rows["corporate_group"] != "")
                                & out_rows.duplicated(["opportunity_id", "corporate_group"]))
    out_rows.loc[out_rows["_dup_sibling"], "evidence_flag"] = (
        out_rows.loc[out_rows["_dup_sibling"], "evidence_flag"]
        .map(lambda f: (f + ";" if f else "") + "group_sibling_demoted"))
    out_rows = out_rows.sort_values(
        ["opportunity_id", "_dup_sibling", "_tier", "final_score"],
        ascending=[True, True, True, False], kind="mergesort")
    out_rows["rank"] = out_rows.groupby("opportunity_id").cumcount() + 1
    n_dup = int(out_rows["_dup_sibling"].sum())
    if n_dup:
        print(f"Group-sibling demotions: {n_dup} rows moved below their shortlists.")
    lead = out_rows[out_rows["rank"] == 1].set_index("opportunity_id")
    out_rows["_lead_tier"] = out_rows["opportunity_id"].map(lead["_tier"])
    out_rows["_lead_score"] = out_rows["opportunity_id"].map(lead["final_score"])
    out = out_rows.sort_values(["_lead_tier", "_lead_score", "opportunity_id", "rank"],
                               ascending=[True, False, True, True])[COLUMNS]
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    out.to_csv(OUTPUT_CSV, index=False)

    summary_path = write_summary(out, companies, opps, opp_enrich,
                                 gate_flips=flip_rows)
    print(f"Dataset verdict written to {summary_path}")

    dist = out["decision"].value_counts().to_dict()
    print(f"\nWrote {OUTPUT_CSV}: {len(out)} rows.")
    print("Decision distribution:", dist)
    print("Penalties applied on", int((df['_penalties'].str.len() > 0).sum()),
          "of", len(df), "pairs.")

    if not args.no_db:
        try:
            from load_to_db_v3 import clear_matching_output, upsert_matches, load_csv
            if args.replace_matches or args.source == "db":
                deleted = clear_matching_output()
                print(f"Cleared {deleted} prior model_version=v3 MatchingOutput rows.")
            if args.source == "db" or "db_id" in companies.columns:
                stats = upsert_matches(out)
            else:
                stats = load_csv(OUTPUT_CSV)
            print(f"Database '{stats['dbname']}': {stats['inserted']} rows inserted, "
                  f"{stats['updated']} updated in MatchingOutput "
                  f"(+{stats['companies_created']} companies, "
                  f"+{stats['opportunities_created']} opportunities created).")
        except Exception as exc:
            print(f"Database load FAILED (CSV output unaffected): {exc}")
    return out


if __name__ == "__main__":
    main()
