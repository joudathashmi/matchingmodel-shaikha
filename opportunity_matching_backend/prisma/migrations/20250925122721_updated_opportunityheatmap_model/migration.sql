/*
  Warnings:

  - You are about to drop the column `totalValueBillion` on the `OpportunityHeatmap` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."OpportunityHeatmap" DROP COLUMN "totalValueBillion",
ADD COLUMN     "totalValueMillion" DOUBLE PRECISION,
ALTER COLUMN "calculatedAt" DROP DEFAULT,
ALTER COLUMN "calculatedAt" SET DATA TYPE TIMESTAMP(6);
