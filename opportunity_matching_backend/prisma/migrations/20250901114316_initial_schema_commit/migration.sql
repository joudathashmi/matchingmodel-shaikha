-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "loggedOutAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_sector" TEXT,
    "year_founded" INTEGER,
    "company_profile" TEXT,
    "product_services" TEXT,
    "legal_structure" TEXT,
    "type_of_entity" TEXT,
    "status" TEXT,
    "control_structure" TEXT,
    "ultimate_parent_company" TEXT,
    "global_headquarters" TEXT,
    "number_of_employees" INTEGER,
    "number_of_locations" INTEGER,
    "fiscal_year_end_date" TIMESTAMP(3),
    "revenue_local_currency" DOUBLE PRECISION,
    "currency" TEXT,
    "revenue_usd" DOUBLE PRECISION,
    "presence_of_parent_company_in_mena" BOOLEAN,
    "presence_of_company_in_mena" BOOLEAN,
    "type_of_presence" TEXT,
    "mena_revenue_local_currency" DOUBLE PRECISION,
    "ksa_revenue_local_currency" DOUBLE PRECISION,
    "history_in_mena" TEXT,
    "presence_in_saudi" BOOLEAN,
    "type_of_presence_saudi" TEXT,
    "companies_name_in_mena" TEXT,
    "companies_name_in_ksa" TEXT,
    "number_of_employees_parent" INTEGER,
    "number_of_employees_ksa" INTEGER,
    "number_of_employees_mena" INTEGER,
    "mena_locations" TEXT,
    "mena_notes" TEXT,
    "rhq_status" TEXT,
    "rhq_license_status" TEXT,
    "rhq_country" TEXT,
    "rhq_city" TEXT,
    "rhq_country_coverage" TEXT,
    "rhq_entity_name" TEXT,
    "rhq_in_mena" BOOLEAN,
    "rhq_number_of_employees" INTEGER,
    "rhq_mandatory_activities" TEXT,
    "rhq_optional_activities" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Opportunity" (
    "id" SERIAL NOT NULL,
    "opportunity_name" TEXT NOT NULL,
    "sector" TEXT,
    "opportunity_description" TEXT,
    "investment_highlights" TEXT,
    "value_proposition" TEXT,
    "key_demand_drivers" TEXT,
    "key_players" TEXT,
    "materials_required" TEXT,
    "url" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatchingOutput" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "company_sector" TEXT,
    "opportunity_sector" TEXT,
    "sector_similarity" DOUBLE PRECISION,
    "profile_similarity" DOUBLE PRECISION,
    "product_similarity" DOUBLE PRECISION,
    "ai_score" DOUBLE PRECISION,
    "ai_decision" TEXT,
    "final_score" DOUBLE PRECISION,
    "ai_explanation" TEXT,
    "rank" INTEGER,

    CONSTRAINT "MatchingOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectorsMapping" (
    "id" SERIAL NOT NULL,
    "source_sector" TEXT NOT NULL,
    "target_sector" TEXT NOT NULL,
    "mapping_notes" TEXT,

    CONSTRAINT "SectorsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_company_opportunity" ON "public"."MatchingOutput"("companyId", "opportunityId");

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchingOutput" ADD CONSTRAINT "MatchingOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatchingOutput" ADD CONSTRAINT "MatchingOutput_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
