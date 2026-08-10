--
-- PostgreSQL database dump
--

\restrict kTXdJCIXHO7NHPc52kUj7eDOT8nXzEVJy4BDFt1antvH8MuE7BaJoRbgRXQgxFh

-- Dumped from database version 17.5
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AIInsight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AIInsight" (
    id integer NOT NULL,
    page text NOT NULL,
    "insightType" text NOT NULL,
    description text NOT NULL,
    score double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AIInsight_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AIInsight_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AIInsight_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AIInsight_id_seq" OWNED BY public."AIInsight".id;


--
-- Name: AppSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AppSetting" (
    key text NOT NULL,
    value jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedBy" text
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    metadata jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Bookmark; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bookmark" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "entityId" integer NOT NULL,
    "entityType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Bookmark_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Bookmark_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Bookmark_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Bookmark_id_seq" OWNED BY public."Bookmark".id;


--
-- Name: Company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Company" (
    id integer NOT NULL,
    company_name text NOT NULL,
    company_sector text,
    year_founded integer,
    company_profile text,
    product_services text,
    legal_structure text,
    type_of_entity text,
    status text,
    control_structure text,
    ultimate_parent_company text,
    global_headquarters text,
    number_of_employees integer,
    number_of_locations integer,
    fiscal_year_end_date timestamp(3) without time zone,
    revenue_local_currency double precision,
    currency text,
    revenue_usd double precision,
    presence_of_parent_company_in_mena boolean,
    presence_of_company_in_mena boolean,
    type_of_presence text,
    mena_revenue_local_currency double precision,
    ksa_revenue_local_currency double precision,
    history_in_mena text,
    presence_in_saudi boolean,
    type_of_presence_saudi text,
    companies_name_in_mena text,
    companies_name_in_ksa text,
    number_of_employees_parent integer,
    number_of_employees_ksa integer,
    number_of_employees_mena integer,
    mena_locations text,
    mena_notes text,
    rhq_status text,
    rhq_license_status text,
    rhq_country text,
    rhq_city text,
    rhq_country_coverage text,
    rhq_entity_name text,
    rhq_in_mena boolean,
    rhq_number_of_employees integer,
    rhq_mandatory_activities text,
    rhq_optional_activities text,
    website_url text
);


--
-- Name: Company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Company_id_seq" OWNED BY public."Company".id;


--
-- Name: DashboardKPI; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DashboardKPI" (
    id integer NOT NULL,
    page text NOT NULL,
    name text NOT NULL,
    value double precision NOT NULL,
    unit text,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sub_title text
);


--
-- Name: DashboardKPI_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DashboardKPI_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DashboardKPI_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DashboardKPI_id_seq" OWNED BY public."DashboardKPI".id;


--
-- Name: KeyFinding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."KeyFinding" (
    id integer NOT NULL,
    page text NOT NULL,
    title text NOT NULL,
    detail text NOT NULL,
    additionaldata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: KeyFinding_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."KeyFinding_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: KeyFinding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."KeyFinding_id_seq" OWNED BY public."KeyFinding".id;


--
-- Name: MatchAgreement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MatchAgreement" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "matchId" integer NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MatchAgreement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MatchAgreement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MatchAgreement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MatchAgreement_id_seq" OWNED BY public."MatchAgreement".id;


--
-- Name: MatchComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MatchComment" (
    id text NOT NULL,
    "matchId" integer NOT NULL,
    "userId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MatchingOutput; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MatchingOutput" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "opportunityId" integer NOT NULL,
    company_name text,
    opportunity_name text,
    company_sector text,
    opportunity_sector text,
    sector_similarity double precision,
    profile_similarity double precision,
    product_similarity double precision,
    ai_score double precision,
    ai_decision text,
    final_score double precision,
    ai_explanation text,
    rank integer,
    ai_insight text,
    suggested_plan text,
    match_reason text,
    decision_tier text,
    confidence_score integer,
    confidence_label text,
    evidence_flag text,
    corporate_group text,
    business_model text,
    value_chain_role text,
    value_chain_position text,
    value_chain_score double precision,
    match_type text,
    opportunity_status text,
    strengths text,
    risks text,
    recommended_engagement text,
    suggested_localization_model text,
    human_verdict text,
    model_version text,
    matched_at timestamp with time zone
);


--
-- Name: MatchingOutput_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MatchingOutput_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MatchingOutput_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MatchingOutput_id_seq" OWNED BY public."MatchingOutput".id;


--
-- Name: Opportunity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Opportunity" (
    id integer NOT NULL,
    opportunity_name text NOT NULL,
    sector text,
    opportunity_description text,
    investment_highlights text,
    value_proposition text,
    key_demand_drivers text,
    key_players text,
    materials_required text,
    url text,
    economic_impact text,
    gdp_impact text,
    innovation_index text,
    investment_appeal text,
    investment_range text,
    jobs_created text,
    market_readiness text,
    match_quality_range text,
    region text,
    location text,
    project_duration text,
    strategic_priority text,
    market_size text
);


--
-- Name: OpportunityHeatmap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OpportunityHeatmap" (
    id integer NOT NULL,
    sector text NOT NULL,
    "sizeBucket" text NOT NULL,
    "opportunityCount" integer NOT NULL,
    "avgMatchScore" double precision,
    density double precision,
    tooltip text,
    "calculatedAt" timestamp(6) without time zone NOT NULL,
    "totalValueMillion" double precision
);


--
-- Name: OpportunityHeatmap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OpportunityHeatmap_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OpportunityHeatmap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OpportunityHeatmap_id_seq" OWNED BY public."OpportunityHeatmap".id;


--
-- Name: Opportunity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Opportunity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Opportunity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Opportunity_id_seq" OWNED BY public."Opportunity".id;


--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    "tokenHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text
);


--
-- Name: SectorsMapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SectorsMapping" (
    id integer NOT NULL,
    source_sector text NOT NULL,
    target_sector text NOT NULL,
    mapping_notes text
);


--
-- Name: SectorsMapping_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SectorsMapping_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SectorsMapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SectorsMapping_id_seq" OWNED BY public."SectorsMapping".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "loggedOutAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "passwordHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "mustChangePassword" boolean DEFAULT false NOT NULL,
    "passwordResetTokenHash" text,
    "passwordResetExpires" timestamp(3) without time zone
);


--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRole" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: AIInsight id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIInsight" ALTER COLUMN id SET DEFAULT nextval('public."AIInsight_id_seq"'::regclass);


--
-- Name: Bookmark id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bookmark" ALTER COLUMN id SET DEFAULT nextval('public."Bookmark_id_seq"'::regclass);


--
-- Name: Company id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company" ALTER COLUMN id SET DEFAULT nextval('public."Company_id_seq"'::regclass);


--
-- Name: DashboardKPI id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DashboardKPI" ALTER COLUMN id SET DEFAULT nextval('public."DashboardKPI_id_seq"'::regclass);


--
-- Name: KeyFinding id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KeyFinding" ALTER COLUMN id SET DEFAULT nextval('public."KeyFinding_id_seq"'::regclass);


--
-- Name: MatchAgreement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchAgreement" ALTER COLUMN id SET DEFAULT nextval('public."MatchAgreement_id_seq"'::regclass);


--
-- Name: MatchingOutput id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchingOutput" ALTER COLUMN id SET DEFAULT nextval('public."MatchingOutput_id_seq"'::regclass);


--
-- Name: Opportunity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Opportunity" ALTER COLUMN id SET DEFAULT nextval('public."Opportunity_id_seq"'::regclass);


--
-- Name: OpportunityHeatmap id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OpportunityHeatmap" ALTER COLUMN id SET DEFAULT nextval('public."OpportunityHeatmap_id_seq"'::regclass);


--
-- Name: SectorsMapping id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SectorsMapping" ALTER COLUMN id SET DEFAULT nextval('public."SectorsMapping_id_seq"'::regclass);


--
-- Name: AIInsight AIInsight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIInsight"
    ADD CONSTRAINT "AIInsight_pkey" PRIMARY KEY (id);


--
-- Name: AppSetting AppSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AppSetting"
    ADD CONSTRAINT "AppSetting_pkey" PRIMARY KEY (key);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Bookmark Bookmark_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bookmark"
    ADD CONSTRAINT "Bookmark_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: DashboardKPI DashboardKPI_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DashboardKPI"
    ADD CONSTRAINT "DashboardKPI_pkey" PRIMARY KEY (id);


--
-- Name: KeyFinding KeyFinding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."KeyFinding"
    ADD CONSTRAINT "KeyFinding_pkey" PRIMARY KEY (id);


--
-- Name: MatchAgreement MatchAgreement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchAgreement"
    ADD CONSTRAINT "MatchAgreement_pkey" PRIMARY KEY (id);


--
-- Name: MatchComment MatchComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchComment"
    ADD CONSTRAINT "MatchComment_pkey" PRIMARY KEY (id);


--
-- Name: MatchingOutput MatchingOutput_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchingOutput"
    ADD CONSTRAINT "MatchingOutput_pkey" PRIMARY KEY (id);


--
-- Name: OpportunityHeatmap OpportunityHeatmap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OpportunityHeatmap"
    ADD CONSTRAINT "OpportunityHeatmap_pkey" PRIMARY KEY (id);


--
-- Name: Opportunity Opportunity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Opportunity"
    ADD CONSTRAINT "Opportunity_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SectorsMapping SectorsMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SectorsMapping"
    ADD CONSTRAINT "SectorsMapping_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: MatchingOutput uq_company_opportunity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchingOutput"
    ADD CONSTRAINT uq_company_opportunity UNIQUE ("companyId", "opportunityId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_actorId_idx" ON public."AuditLog" USING btree ("actorId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entityType_idx" ON public."AuditLog" USING btree ("entityType");


--
-- Name: Bookmark_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bookmark_entityType_entityId_idx" ON public."Bookmark" USING btree ("entityType", "entityId");


--
-- Name: Bookmark_userId_entityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bookmark_userId_entityType_idx" ON public."Bookmark" USING btree ("userId", "entityType");


--
-- Name: MatchAgreement_userId_matchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MatchAgreement_userId_matchId_idx" ON public."MatchAgreement" USING btree ("userId", "matchId");


--
-- Name: MatchAgreement_userId_matchId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MatchAgreement_userId_matchId_key" ON public."MatchAgreement" USING btree ("userId", "matchId");


--
-- Name: MatchComment_matchId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MatchComment_matchId_createdAt_idx" ON public."MatchComment" USING btree ("matchId", "createdAt");


--
-- Name: MatchComment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MatchComment_userId_idx" ON public."MatchComment" USING btree ("userId");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: aiinsight_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX aiinsight_unique ON public."AIInsight" USING btree (page, "insightType", description);


--
-- Name: dashboardkpi_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX dashboardkpi_unique ON public."DashboardKPI" USING btree (page, name, "calculatedAt");


--
-- Name: idx_aiinsight_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aiinsight_page ON public."AIInsight" USING btree (page);


--
-- Name: idx_aiinsight_page_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aiinsight_page_type ON public."AIInsight" USING btree (page, "insightType");


--
-- Name: idx_dashboardkpi_page; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboardkpi_page ON public."DashboardKPI" USING btree (page);


--
-- Name: idx_dashboardkpi_page_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dashboardkpi_page_name ON public."DashboardKPI" USING btree (page, name);


--
-- Name: idx_heatmap_sector_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_heatmap_sector_size ON public."OpportunityHeatmap" USING btree (sector, "sizeBucket");


--
-- Name: idx_keyfinding_page_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_keyfinding_page_title ON public."KeyFinding" USING btree (page, title);


--
-- Name: keyfinding_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX keyfinding_unique ON public."KeyFinding" USING btree (page, title, detail);


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bookmark Bookmark_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bookmark"
    ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MatchAgreement MatchAgreement_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchAgreement"
    ADD CONSTRAINT "MatchAgreement_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public."MatchingOutput"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MatchAgreement MatchAgreement_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchAgreement"
    ADD CONSTRAINT "MatchAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MatchComment MatchComment_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchComment"
    ADD CONSTRAINT "MatchComment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public."MatchingOutput"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MatchComment MatchComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchComment"
    ADD CONSTRAINT "MatchComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MatchingOutput MatchingOutput_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchingOutput"
    ADD CONSTRAINT "MatchingOutput_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MatchingOutput MatchingOutput_opportunityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MatchingOutput"
    ADD CONSTRAINT "MatchingOutput_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES public."Opportunity"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict kTXdJCIXHO7NHPc52kUj7eDOT8nXzEVJy4BDFt1antvH8MuE7BaJoRbgRXQgxFh

