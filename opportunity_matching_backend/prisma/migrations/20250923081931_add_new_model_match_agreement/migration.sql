-- CreateTable
CREATE TABLE "public"."MatchAgreement" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchAgreement_userId_matchId_idx" ON "public"."MatchAgreement"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "public"."MatchAgreement" ADD CONSTRAINT "MatchAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchAgreement" ADD CONSTRAINT "MatchAgreement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."MatchingOutput"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
