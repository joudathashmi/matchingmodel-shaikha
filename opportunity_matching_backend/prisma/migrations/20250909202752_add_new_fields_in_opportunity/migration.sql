/*
  Warnings:

  - A unique constraint covering the columns `[page,insightType,description]` on the table `AIInsight` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[page,name,calculatedAt]` on the table `DashboardKPI` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[page,title,detail]` on the table `KeyFinding` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Opportunity" ADD COLUMN     "economic_impact" TEXT,
ADD COLUMN     "gdp_impact" TEXT,
ADD COLUMN     "innovation_index" TEXT,
ADD COLUMN     "investment_appeal" TEXT,
ADD COLUMN     "investment_range" TEXT,
ADD COLUMN     "jobs_created" TEXT,
ADD COLUMN     "market_readiness" TEXT,
ADD COLUMN     "match_quality_range" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateIndex
CREATE INDEX "idx_aiinsight_page" ON "public"."AIInsight"("page");

-- CreateIndex
CREATE INDEX "idx_aiinsight_page_type" ON "public"."AIInsight"("page", "insightType");

-- CreateIndex
CREATE UNIQUE INDEX "aiinsight_unique" ON "public"."AIInsight"("page", "insightType", "description");

-- CreateIndex
CREATE INDEX "idx_dashboardkpi_page" ON "public"."DashboardKPI"("page");

-- CreateIndex
CREATE INDEX "idx_dashboardkpi_page_name" ON "public"."DashboardKPI"("page", "name");

-- CreateIndex
CREATE UNIQUE INDEX "dashboardkpi_unique" ON "public"."DashboardKPI"("page", "name", "calculatedAt");

-- CreateIndex
CREATE INDEX "idx_keyfinding_page_title" ON "public"."KeyFinding"("page", "title");

-- CreateIndex
CREATE UNIQUE INDEX "keyfinding_unique" ON "public"."KeyFinding"("page", "title", "detail");

-- CreateIndex
CREATE INDEX "idx_heatmap_sector_size" ON "public"."OpportunityHeatmap"("sector", "sizeBucket");
