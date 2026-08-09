-- AlterTable
ALTER TABLE "public"."DashboardKPI" ADD COLUMN     "sub_title" TEXT;

-- AlterTable
ALTER TABLE "public"."MatchingOutput" ADD COLUMN     "ai_insight" TEXT,
ADD COLUMN     "suggested_plan" TEXT;

-- AlterTable
ALTER TABLE "public"."Opportunity" ADD COLUMN     "location" TEXT,
ADD COLUMN     "project_duration" TEXT,
ADD COLUMN     "strategic_priority" TEXT;

-- CreateTable
CREATE TABLE "public"."Bookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bookmark_userId_entityType_idx" ON "public"."Bookmark"("userId", "entityType");

-- CreateIndex
CREATE INDEX "Bookmark_entityType_entityId_idx" ON "public"."Bookmark"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "public"."Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
