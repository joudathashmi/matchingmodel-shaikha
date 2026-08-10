-- Align DB with schema models/columns added after last committed migration
-- (password reset fields, AppSetting, AuditLog, MatchComment, MatchingOutput transparency fields)

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT;

-- AlterTable MatchingOutput (engine / transparency fields)
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "confidence_label" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "confidence_score" INTEGER;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "decision_tier" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "evidence_flag" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "model_version" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "recommended_engagement" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "risks" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "strengths" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "suggested_localization_model" TEXT;
ALTER TABLE "MatchingOutput" ADD COLUMN IF NOT EXISTS "value_chain_position" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MatchComment" (
    "id" TEXT NOT NULL,
    "matchId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "MatchComment_matchId_createdAt_idx" ON "MatchComment"("matchId", "createdAt");
CREATE INDEX IF NOT EXISTS "MatchComment_userId_idx" ON "MatchComment"("userId");

-- AddForeignKey (guarded)
DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchingOutput"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "MatchComment" ADD CONSTRAINT "MatchComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
