// src/store/types/discoveryOpportunitiesTypes.ts

/* ===== Interfaces ===== */
export interface DiscoveryOpportunity {
  id: number;
  opportunityName: string;
  opportunitySector: string;
  opportunityUrl: string;
  relatedTargetSector: string;
  relatedSourceSectors: string[];
  topCompany: {
    id: number;
    name: string;
    company_sector: string;
    score: number;
    ai_insight: string;
    decisionTier?: string | null;
    confidenceScore?: number | null;
    confidenceLabel?: string | null;
    strengths?: string | null;
    risks?: string | null;
    valueChainPosition?: string | null;
    modelVersion?: string | null;
  };
  avgSectorSimilarity: number;
  avgProfileSimilarity: number;
  avgProductSimilarity: number;
  avgAiScore: number;
  avgFinalScore: number;
  maxSectorSimilarity: number;
  maxProfileSimilarity: number;
  maxProductSimilarity: number;
  maxAiScore: number;
  maxFinalScore: number;
  competitionLevel: string;
  isBookmarked: boolean;
  investmentRange: string;
}

export interface DiscoveryOpportunitiesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sectors: string[];
}

export interface DiscoveryOpportunitiesState {
  opportunities: DiscoveryOpportunity[];
  loading: boolean;
  error: string | null;
  meta: DiscoveryOpportunitiesMeta;
}

export interface DiscoveryFilters {
  sectors: string[];
  match_score: { min: number; max: number };
  investment_range: { min: number; max: number };
  locations: string[];
  page: number;
  limit: number;
}

/* ===== Action Types ===== */
export const GET_DISCOVERY_OPPORTUNITIES = "GET_DISCOVERY_OPPORTUNITIES";
export const GET_DISCOVERY_OPPORTUNITIES_SUCCESS =
  "GET_DISCOVERY_OPPORTUNITIES_SUCCESS";
export const GET_DISCOVERY_OPPORTUNITIES_FAILURE =
  "GET_DISCOVERY_OPPORTUNITIES_FAILURE";

/* ===== Request Interface ===== */
export interface DiscoveryOpportunitiesRequest {
  sectors: string[];
  match_score: { min: number; max: number };
  investment_range: { min: number; max: number };
  page: number;
  limit: number;
}

/* ===== Response Interface ===== */
export interface DiscoveryOpportunitiesResponse {
  data: DiscoveryOpportunity[];
  meta: DiscoveryOpportunitiesMeta;
}

/* ===== Action Interfaces ===== */
interface GetDiscoveryOpportunitiesAction {
  type: typeof GET_DISCOVERY_OPPORTUNITIES;
  payload: DiscoveryOpportunitiesRequest;
}

interface GetDiscoveryOpportunitiesSuccessAction {
  type: typeof GET_DISCOVERY_OPPORTUNITIES_SUCCESS;
  payload: DiscoveryOpportunitiesResponse;
}

interface GetDiscoveryOpportunitiesFailureAction {
  type: typeof GET_DISCOVERY_OPPORTUNITIES_FAILURE;
  payload: string;
}

export type DiscoveryOpportunitiesActionTypes =
  | GetDiscoveryOpportunitiesAction
  | GetDiscoveryOpportunitiesSuccessAction
  | GetDiscoveryOpportunitiesFailureAction;
