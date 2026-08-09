export interface TopOpportunity {
  id: number;
  companyId: number;
  companyName: string;
  companySector: string;
  companyWebsite: string | null;
  opportunityId: number;
  opportunityName: string;
  opportunitySector: string;
  opportunityUrl: string;
  sectorSimilarity: number;
  profileSimilarity: number;
  productSimilarity: number;
  aiScore: number;
  rank: number;
  aiDecision: string;
  finalScore: number;
  aiExplanation: string[] | string;
  investmentRange: string;
  projectDuration: string;
  marketSize: string;
  location: string;
  region: string;
  keyDemandDrivers: string;
  decisionTier?: string | null;
  confidenceScore?: number | null;
  confidenceLabel?: string | null;
  evidenceFlag?: string | null;
  valueChainPosition?: string | null;
  strengths?: string | null;
  risks?: string | null;
  recommendedEngagement?: string | null;
  modelVersion?: string | null;
  matchReason?: string[] | string;
}

export interface TopOpportunitiesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sectors: string[];
}

export interface TopOpportunitiesState {
  topOpportunities: TopOpportunity[];
  loading: boolean;
  error: string | null;
  meta: TopOpportunitiesMeta;
}

// Action Types
export const GET_TOP_OPPORTUNITIES = 'GET_TOP_OPPORTUNITIES';
export const GET_TOP_OPPORTUNITIES_SUCCESS = 'GET_TOP_OPPORTUNITIES_SUCCESS';
export const GET_TOP_OPPORTUNITIES_FAILURE = 'GET_TOP_OPPORTUNITIES_FAILURE';

// Request Interface
export interface TopOpportunitiesRequest {
  page: number;
  limit: number;
  sectors?: string[];
}

// Response Interface
export interface TopOpportunitiesResponse {
  data: TopOpportunity[];
  meta: TopOpportunitiesMeta;
}

// Action Interfaces
interface GetTopOpportunitiesAction {
  type: typeof GET_TOP_OPPORTUNITIES;
  payload: TopOpportunitiesRequest;
}

interface GetTopOpportunitiesSuccessAction {
  type: typeof GET_TOP_OPPORTUNITIES_SUCCESS;
  payload: TopOpportunitiesResponse;
}

interface GetTopOpportunitiesFailureAction {
  type: typeof GET_TOP_OPPORTUNITIES_FAILURE;
  payload: string;
}

export type TopOpportunitiesActionTypes =
  | GetTopOpportunitiesAction
  | GetTopOpportunitiesSuccessAction
  | GetTopOpportunitiesFailureAction;
