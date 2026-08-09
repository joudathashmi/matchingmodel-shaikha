export const ROLES = {
  OFFICER: "officer",
  REVIEWER: "reviewer",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  officer: "Officer",
  reviewer: "Reviewer",
  admin: "Admin",
  user: "Officer", // legacy
};

export function primaryRole(roles: string[] | undefined | null): string {
  if (!roles?.length) return ROLES.OFFICER;
  if (roles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
  if (roles.includes(ROLES.REVIEWER)) return ROLES.REVIEWER;
  if (roles.includes(ROLES.OFFICER)) return ROLES.OFFICER;
  if (roles.includes("user")) return ROLES.OFFICER;
  return roles[0];
}

export function roleLabel(roles: string[] | undefined | null): string {
  const p = primaryRole(roles);
  return ROLE_LABELS[p] || p;
}

export function hasRole(roles: string[] | undefined | null, allowed: string[]): boolean {
  if (!roles?.length) return false;
  return allowed.some((r) => roles.includes(r));
}
