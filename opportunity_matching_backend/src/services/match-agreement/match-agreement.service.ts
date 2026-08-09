import { prisma } from "./../../lib/prisma";
// src/services/match-agreement/match-agreement.service.ts


export class MatchAgreementService {
  async setAgreement(
    userId: string,
    matchId: number,
    status:
      | "Agreed"
      | "Disagreed"
      | "Engage"
      | "PlanShared"
      | "MoU"
      | "Landed"
      | "Hold"
      | "Rejected"
  ) {
    // Normalize legacy + IPA statuses
    let normalized = status;
    if (status === "Agreed") normalized = "Engage";
    if (status === "Disagreed" || status === "Rejected") normalized = "Rejected";
    return prisma.matchAgreement.upsert({
      where: { userId_matchId: { userId, matchId } },
      update: { status: normalized },
      create: { userId, matchId, status: normalized },
    });
  }

  async deleteAgreement(userId: string, matchId: number) {
    return prisma.matchAgreement.deleteMany({
      where: { userId, matchId },
    });
  }

  async getUserAgreements(
    userId: string,
    status?: "Agreed" | "Disagreed" | "Engage" | "PlanShared" | "MoU" | "Landed" | "Hold" | "all"
  ) {
    return this.queryAgreements({ userId }, status);
  }

  /** Reviewer / admin: all pursuits across the team. */
  async getAllAgreements(
    status?: "Agreed" | "Disagreed" | "Engage" | "PlanShared" | "MoU" | "Landed" | "Hold" | "all"
  ) {
    return this.queryAgreements({}, status);
  }

  private async queryAgreements(
    baseWhere: { userId?: string },
    status?: "Agreed" | "Disagreed" | "Engage" | "PlanShared" | "MoU" | "Landed" | "Hold" | "all"
  ) {
    const where: any = { ...baseWhere };
    if (status && status !== "all") {
      if (status === "Agreed") {
        where.status = { in: ["Agreed", "Engage", "PlanShared", "MoU", "Landed", "Hold"] };
      } else if (status === "Disagreed") {
        where.status = { in: ["Disagreed", "Rejected"] };
      } else {
        where.status = status;
      }
    }

    const agreements = await prisma.matchAgreement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        match: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
    });

    return agreements.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      user: {
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
      },
      match: {
        id: a.match.id,
        opportunity_id: a.match.opportunity.id,
        opportunity_name: a.match.opportunity.opportunity_name,
        opportunity_sector: a.match.opportunity.sector,
        opportunity_url: a.match.opportunity.url,
        company_id: a.match.company.id,
        company_name: a.match.company.company_name,
        company_sector: a.match.company.company_sector,
        company_url: a.match.company.website_url,
      },
    }));
  }
}
