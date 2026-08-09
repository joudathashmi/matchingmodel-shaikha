import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = [
  {
    name: "officer",
    description: "Day-to-day: Portfolio, Explore, Workbench, Pursuit",
  },
  {
    name: "reviewer",
    description: "Officer access plus team-wide pursuit visibility",
  },
  {
    name: "admin",
    description: "Full access including users, roles, and system settings",
  },
];

async function main() {
  for (const role of ROLES) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    console.log("Upserted role:", r.name);
  }

  // Migrate legacy "user" → "officer"
  const legacyUser = await prisma.role.findUnique({ where: { name: "user" } });
  const officer = await prisma.role.findUnique({ where: { name: "officer" } });
  if (legacyUser && officer) {
    const links = await prisma.userRole.findMany({
      where: { roleId: legacyUser.id },
    });
    for (const link of links) {
      const alreadyOfficer = await prisma.userRole.findFirst({
        where: { userId: link.userId, roleId: officer.id },
      });
      if (!alreadyOfficer) {
        await prisma.userRole.create({
          data: { userId: link.userId, roleId: officer.id },
        });
      }
      await prisma.userRole.delete({ where: { id: link.id } });
    }
    await prisma.role.delete({ where: { id: legacyUser.id } }).catch(() => {
      /* may still be referenced - ignore */
    });
    console.log(`Migrated ${links.length} user → officer assignment(s)`);
  }

  // Users with no role get officer
  const users = await prisma.user.findMany({
    include: { roles: true },
  });
  for (const user of users) {
    if (user.roles.length === 0 && officer) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: officer.id },
      });
      console.log(`Assigned officer to ${user.email}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
