/** IPA pursuit stages - company×opportunity deal lifecycle */
export const PURSUIT_STAGES = [
  { id: "Engage", label: "Engage", description: "Open dialogue with the company" },
  { id: "PlanShared", label: "Plan shared", description: "Engagement / localization plan with company" },
  { id: "MoU", label: "MoU", description: "Memorandum or formal intent" },
  { id: "Landed", label: "Landed", description: "Investment commitment secured" },
] as const;

export type PursuitStageId = (typeof PURSUIT_STAGES)[number]["id"];

export const PURSUIT_SIDE_STATUSES = [
  { id: "Hold", label: "Hold" },
  { id: "Rejected", label: "Rejected" },
] as const;

export type PursuitStatus =
  | PursuitStageId
  | "Hold"
  | "Rejected"
  | "Agreed"
  | "Disagreed";

export function normalizePursuitStatus(status?: string | null): PursuitStatus | null {
  if (!status) return null;
  if (status === "Agreed") return "Engage";
  if (status === "Disagreed") return "Rejected";
  const known = [
    "Engage",
    "PlanShared",
    "MoU",
    "Landed",
    "Hold",
    "Rejected",
  ];
  return known.includes(status) ? (status as PursuitStatus) : null;
}

export function isActivePursuit(status?: string | null): boolean {
  const n = normalizePursuitStatus(status);
  return n === "Engage" || n === "PlanShared" || n === "MoU" || n === "Landed" || n === "Hold";
}
