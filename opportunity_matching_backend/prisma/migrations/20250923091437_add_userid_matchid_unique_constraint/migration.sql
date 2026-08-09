/*
  Warnings:

  - A unique constraint covering the columns `[userId,matchId]` on the table `MatchAgreement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MatchAgreement_userId_matchId_key" ON "public"."MatchAgreement"("userId", "matchId");
