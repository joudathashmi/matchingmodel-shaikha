export type TourStepDef = {
  id: string;
  /** CSS selector - prefer [data-tour="…"] */
  element: string;
  route?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  /** Only show for admin users */
  adminOnly?: boolean;
};

export const TOUR_STEPS: TourStepDef[] = [
  {
    id: "nav-portfolio",
    element: '[data-tour="nav-portfolio"]',
    route: "/portfolio",
    title: "Matching overview",
    description:
      "Your leadership pulse - coverage, insights, and findings for the investment attraction programme.",
    side: "right",
  },
  {
    id: "nav-matches",
    element: '[data-tour="nav-matches"]',
    route: "/match-workbench",
    title: "Matches",
    description:
      "Ranked company-opportunity pairs. Filter by sector and score, then open a case or move a deal into Pursuit.",
    side: "right",
  },
  {
    id: "matches-workspace",
    element: '[data-tour="matches-workspace"]',
    route: "/match-workbench",
    title: "Triage the workbench",
    description:
      "Each card shows fit, strength, and risk. Click Start pursuit to put it on your pipeline, or open Match Case for full evidence.",
    side: "top",
  },
  {
    id: "nav-pursuit",
    element: '[data-tour="nav-pursuit"]',
    route: "/pursuit",
    title: "Pursuit",
    description:
      "Move agreed matches through Engage → Plan shared → MoU → Landed. This is your live deal pipeline.",
    side: "right",
  },
  {
    id: "nav-explore",
    element: '[data-tour="nav-explore"]',
    route: "/explore",
    title: "Discover opportunities",
    description:
      "Research whitespace and ranked company-opportunity candidates. Jump from here into focused match lists.",
    side: "right",
  },
  {
    id: "nav-companies",
    element: '[data-tour="nav-companies"]',
    route: "/companyProfile",
    title: "Catalogs",
    description:
      "Browse company and opportunity records. Bookmark anything you want to return to later.",
    side: "right",
  },
  {
    id: "nav-settings",
    element: '[data-tour="nav-settings"]',
    route: "/systemSettings",
    title: "Settings",
    description:
      "Preferences, alerts, and - for admins - users, roles, and the activity log.",
    side: "right",
  },
  {
    id: "settings-roles",
    element: '[data-tour="settings-roles"]',
    route: "/systemSettings",
    title: "Users & roles",
    description:
      "Add officers and reviewers, assign roles, and keep access aligned with your unit.",
    side: "bottom",
    adminOnly: true,
  },
];

export function stepsForRole(isAdmin: boolean): TourStepDef[] {
  return TOUR_STEPS.filter((s) => !s.adminOnly || isAdmin);
}
