// src/services/bookmark/bookmark.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class BookmarkService {
  async createBookmark(userId: string, entityId: number, entityType: string) {
    return prisma.bookmark.create({
      data: {
        userId,
        entityId,
        entityType,
      },
    });
  }

  async deleteBookmark(userId: string, entityId: number, entityType: string) {
    return prisma.bookmark.deleteMany({
      where: { userId, entityId, entityType },
    });
  }

  async getUserBookmarks(userId: string, entityType?: "opportunity" | "company" | "match" | "all") {
    const where: any = { userId };

    if (entityType && entityType !== "all") {
      where.entityType = entityType
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Fetch details for each bookmark
    const detailedBookmarks = await Promise.all(
      bookmarks.map(async (b) => {
        if (b.entityType === "opportunity") {
          const opp = await prisma.opportunity.findUnique({
            where: { id: b.entityId },
            select: { id: true, opportunity_name: true, sector: true, url: true },
          });
          return {
            ...b,
            details: opp
              ? {
                  id: opp.id,
                  name: opp.opportunity_name,
                  sector: opp.sector,
                  url: opp.url,
                }
              : null,
          };
        } else if (b.entityType === "company") {
          const company = await prisma.company.findUnique({
            where: { id: b.entityId },
            select: { id: true, company_name: true, company_sector: true, website_url: true },
          });
          return {
            ...b,
            details: company
              ? {
                  id: company.id,
                  name: company.company_name,
                  sector: company.company_sector,
                  url: company.website_url,
                }
              : null,
          };
        } else if (b.entityType === "match") {
          const match = await prisma.matchingOutput.findUnique({
            where: { id: b.entityId },
            select: { id: true, opportunity: true, company: true, opportunity_sector: true, company_sector: true},
          });
          return {
            ...b,
            details: match
              ? {
                  id: match.id,
                  opportunity_id: match.opportunity.id,
                  opportunity_name: match.opportunity.opportunity_name,
                  opportunity_sector: match.opportunity.sector,
                  opportunity_url: match.opportunity.url,
                  company_id: match.company.id,
                  company_name: match.company.company_name,
                  company_sector: match.company.company_sector,
                  company_url: match.company.website_url,
                }
              : null,
          };
        }
        return b;
      })
    );

    return detailedBookmarks;
  }
}