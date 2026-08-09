-- CreateTable
CREATE TABLE "public"."DashboardKPI" (
    "id" SERIAL NOT NULL,
    "page" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpportunityHeatmap" (
    "id" SERIAL NOT NULL,
    "sector" TEXT NOT NULL,
    "sizeBucket" TEXT NOT NULL,
    "opportunityCount" INTEGER NOT NULL,
    "avgMatchScore" DOUBLE PRECISION,
    "totalValueBillion" DOUBLE PRECISION,
    "density" DOUBLE PRECISION,
    "tooltip" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityHeatmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIInsight" (
    "id" SERIAL NOT NULL,
    "page" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."KeyFinding" (
    "id" SERIAL NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "additionaldata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeyFinding_pkey" PRIMARY KEY ("id")
);
