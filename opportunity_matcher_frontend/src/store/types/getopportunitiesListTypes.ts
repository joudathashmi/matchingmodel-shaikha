export interface Opportunity {
  id: number;
  opportunityName: string;
  opportunitySector: string;
  opportunityUrl: string;
  avgSectorSimilarity: number;
  avgProfileSimilarity: number;
  avgProductSimilarity: number;
  avgAiScore: number;
  avgFinalScore: number;
  totalCompaniesMatched: number;
  isBookmarked: boolean;
  investmentRange:string;
  jobsCreated:string;
  keyDemandDrivers:string;
  gdpImpact:string;
  investmentAppeal:string;
  economicImpact:string;
  marketReadiness:string;
  valueProposition:string;
}

export interface OpportunitiesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sectors: string[];
  sort_by: string;
  sort_order: string;
}

export interface OpportunitiesResponse {
  data: Opportunity[];
  meta: OpportunitiesMeta;
}

export interface OpportunitiesFilters {
  sectors?: string[];
  ai_score?: { min: number; max: number };
  investment_range?: { min: number; max: number };
  sort_by?: string;
  sort_order?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OpportunitiesListRequest extends OpportunitiesFilters {
  page: number;
  limit: number;
}

export interface SectorCount {
  sector: string;
  count: number;
}

export interface OpportunitiesSectorCountsResponse {
  data: SectorCount[];
}

export interface OpportunitiesState {
  data: Opportunity[];
  meta: OpportunitiesMeta | null;
  loading: boolean;
  error: string | null;
  filters: OpportunitiesFilters;
}

// Action Types
export const GET_OPPORTUNITIES_LIST_REQUEST = 'GET_OPPORTUNITIES_LIST_REQUEST';
export const GET_OPPORTUNITIES_LIST_SUCCESS = 'GET_OPPORTUNITIES_LIST_SUCCESS';
export const GET_OPPORTUNITIES_LIST_FAILURE = 'GET_OPPORTUNITIES_LIST_FAILURE';
export const SET_OPPORTUNITIES_FILTERS = 'SET_OPPORTUNITIES_FILTERS';

interface GetOpportunitiesListRequestAction {
  type: typeof GET_OPPORTUNITIES_LIST_REQUEST;
  payload: OpportunitiesListRequest;
}

interface GetOpportunitiesListSuccessAction {
  type: typeof GET_OPPORTUNITIES_LIST_SUCCESS;
  payload: OpportunitiesResponse;
}

interface GetOpportunitiesListFailureAction {
  type: typeof GET_OPPORTUNITIES_LIST_FAILURE;
  payload: string;
}

interface SetOpportunitiesFiltersAction {
  type: typeof SET_OPPORTUNITIES_FILTERS;
  payload: OpportunitiesFilters;
}

export type OpportunitiesActionTypes =
  | GetOpportunitiesListRequestAction
  | GetOpportunitiesListSuccessAction
  | GetOpportunitiesListFailureAction
  | SetOpportunitiesFiltersAction;  