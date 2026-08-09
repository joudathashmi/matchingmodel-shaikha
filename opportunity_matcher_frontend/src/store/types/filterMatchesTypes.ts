// filterMatchesTypes.ts

// Interfaces
export interface ActiveMatch {
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
  aiExplanation: string[];
  isBookmarked: boolean;  
  relatedSourceSectors: string[];
  relatedTargetSector: string;
  suggestedPlan: string[] | string;
  matchReason: string[] | string;
  userAgreement: string;
  decisionTier?: string | null;
  confidenceScore?: number | null;
  confidenceLabel?: string | null;
  evidenceFlag?: string | null;
  valueChainPosition?: string | null;
  strengths?: string | null;
  risks?: string | null;
  recommendedEngagement?: string | null;
  localizationModel?: string | null;
  modelVersion?: string | null;
  aiInsight?: string | null;
}

export interface ActiveMatchesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sectors: string[];
  companies: string[];
}

export interface ActiveMatchesState {
  activeMatches: ActiveMatch[];
  loading: boolean;
  error: string | null;
  meta: ActiveMatchesMeta;
}

// Action Types
export const GET_ACTIVE_MATCHES = 'GET_ACTIVE_MATCHES';
export const GET_ACTIVE_MATCHES_SUCCESS = 'GET_ACTIVE_MATCHES_SUCCESS';
export const GET_ACTIVE_MATCHES_FAILURE = 'GET_ACTIVE_MATCHES_FAILURE';

// Request Interface
export interface ActiveMatchesRequest {
  page: number;
  limit: number;
  sectors?: string[];
  companies?: string[];
  ai_decision?: string;
  final_score?: {
    min: number;
    max: number;
  };
}

// Response Interface
export interface ActiveMatchesResponse {
  data: ActiveMatch[];
  meta: ActiveMatchesMeta;
}

// Action Interfaces
interface GetActiveMatchesAction {
  type: typeof GET_ACTIVE_MATCHES;
  payload: ActiveMatchesRequest;
}

interface GetActiveMatchesSuccessAction {
  type: typeof GET_ACTIVE_MATCHES_SUCCESS;
  payload: ActiveMatchesResponse;
}

interface GetActiveMatchesFailureAction {
  type: typeof GET_ACTIVE_MATCHES_FAILURE;
  payload: string;
}

export type ActiveMatchesActionTypes =
  | GetActiveMatchesAction
  | GetActiveMatchesSuccessAction
  | GetActiveMatchesFailureAction;
