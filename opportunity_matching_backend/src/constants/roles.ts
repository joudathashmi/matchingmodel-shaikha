/** App roles - keep this list small. */
export const ROLES = {
  OFFICER: "officer",
  REVIEWER: "reviewer",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: AppRole[] = [
  ROLES.OFFICER,
  ROLES.REVIEWER,
  ROLES.ADMIN,
];

export const ROLE_META: Record<
  AppRole,
  { name: AppRole; description: string }
> = {
  officer: {
    name: "officer",
    description: "Day-to-day: Portfolio, Explore, Workbench, Pursuit",
  },
  reviewer: {
    name: "reviewer",
    description: "Officer access plus team-wide pursuit visibility",
  },
  admin: {
    name: "admin",
    description: "Full access including users, roles, and system settings",
  },
};

export function isAppRole(value: string): value is AppRole {
  return ALL_ROLES.includes(value as AppRole);
}

export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return allowed.some((r) => userRoles.includes(r));
}
