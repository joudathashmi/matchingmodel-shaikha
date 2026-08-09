import { ALL_ROLES, isAppRole, ROLE_META, type AppRole } from "../../constants/roles";
import { prisma } from "./../../lib/prisma";


export async function ensureRole(roleName: string) {
  const meta = isAppRole(roleName) ? ROLE_META[roleName] : null;
  return prisma.role.upsert({
    where: { name: roleName },
    update: meta ? { description: meta.description } : {},
    create: {
      name: roleName,
      description: meta?.description ?? null,
    },
  });
}

/** Add a role without removing existing ones (idempotent). */
export async function assignRoleToUser(userId: string, roleName: string) {
  const role = await ensureRole(roleName);
  const existing = await prisma.userRole.findFirst({
    where: { userId, roleId: role.id },
  });
  if (existing) return existing;
  return prisma.userRole.create({
    data: { userId, roleId: role.id },
  });
}

/** Replace all roles with a single primary role. */
export async function setUserRole(userId: string, roleName: AppRole) {
  if (!isAppRole(roleName)) {
    throw new Error(`Invalid role: ${roleName}`);
  }
  const role = await ensureRole(roleName);
  await prisma.userRole.deleteMany({ where: { userId } });
  return prisma.userRole.create({
    data: { userId, roleId: role.id },
  });
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const roles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return roles.map((r) => r.role.name);
}

export function listRoleCatalog() {
  return ALL_ROLES.map((name) => ROLE_META[name]);
}
