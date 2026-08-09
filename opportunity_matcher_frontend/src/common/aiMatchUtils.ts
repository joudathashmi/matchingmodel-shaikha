// Shared AI visual language helpers for match surfaces
export type ConfidenceLabel = "High" | "Medium" | "Low" | string | null | undefined;

/** Machine flags from matching_v3 → officer-readable demotion reasons. */
export const EVIDENCE_FLAG_LABELS: Record<string, string> = {
  gate_rejected: "Gate rejected this fit despite a high score",
  light_gate_cap: "Only light gate vetting - capped at Potential",
  gate_partial_cap: "Partial gate agreement - Excellent capped to Strong",
  ungated_cap: "Not fully gate-examined - capped at Potential",
  human_disagree: "Analyst disagreed with the pair",
  human_agree_floor: "Analyst floor applied (Good Match minimum)",
  sector_mismatch_cap: "Cross-sector with no product evidence",
  thin_profile_cap: "Company profile too thin for a vetted tier",
  low_confidence_demotion: "Confidence below vetted threshold",
  exact_product_for_excellent: "Excellent needs exact product evidence",
  family_product_for_strong: "Strong needs same-family product evidence",
  family_product_for_good: "Good needs same-family product evidence",
  anchor_sibling_demoted: "Another Anchor already leads this opportunity",
  group_sibling_demoted: "Corporate-group sibling already shortlisted",
};

export function parseEvidenceFlags(flag?: string | null): string[] {
  if (!flag) return [];
  return String(flag)
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function humanizeEvidenceFlags(flag?: string | null): string[] {
  return parseEvidenceFlags(flag).map(
    (f) => EVIDENCE_FLAG_LABELS[f] || f.replace(/_/g, " ")
  );
}

export function scorePercent(score?: number | null): number {
  if (score == null || Number.isNaN(score)) return 0;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

export function confidenceTone(label?: ConfidenceLabel, score?: number | null): "high" | "medium" | "low" {
  const l = (label || "").toLowerCase();
  if (l.includes("high") || (score != null && score >= 82)) return "high";
  if (l.includes("low") || (score != null && score < 55)) return "low";
  return "medium";
}

export function truncateText(text?: string | null, max = 220): string {
  const t = (text || "").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Short chip label from a value-chain narrative or role string. */
const VALUE_CHAIN_ROLES = [
  "System Integrator",
  "Subsystem Supplier",
  "Component Supplier",
  "Raw Material",
  "End Customer",
  "JV Partner",
  "JV partner",
  "Operator",
  "OEM",
];

export function shortValueChainLabel(text?: string | null): string | null {
  const t = (text || "").trim();
  if (!t) return null;
  // Already a short role token
  if (t.length <= 28 && !/[.]/.test(t)) return t;
  for (const role of VALUE_CHAIN_ROLES) {
    if (new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t)) {
      return role === "JV partner" ? "JV Partner" : role;
    }
  }
  return null;
}

/** Drop statistical junk so AI insights read as analyst briefs. */
export function isAnalystGradeInsight(description?: string | null): boolean {
  if (!description) return false;
  const d = description.toLowerCase();
  if (d.includes("nan")) return false;
  if (/\bentropy\b/.test(d)) return false;
  if (/\bhhi\b/.test(d) && /\d+\.\d{3,}/.test(d)) return false;
  // Absurd aggregate values (e.g. trillions from bad parsing)
  if (/\b\d{10,}\b/.test(d.replace(/,/g, ""))) return false;
  if (d.includes("0% of positive matches") || d.includes("strong rate 0%")) return false;
  return description.trim().length > 24;
}

export function titleFromInsightType(insightType?: string | null): string {
  if (!insightType) return "Insight";
  return insightType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
