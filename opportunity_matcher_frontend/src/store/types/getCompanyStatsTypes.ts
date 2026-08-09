export interface CompanyStats {
  totalCompanies: number;
  meenaPresence: number;
  saudiActive: number;
  rhqEntities: number;
  averageRevenue: number;
}

export interface CompanyStatsState {
  data: CompanyStats | null;
  loading: boolean;
  error: string | null;
}

export const GET_COMPANY_STATS_REQUEST = 'GET_COMPANY_STATS_REQUEST';
export const GET_COMPANY_STATS_SUCCESS = 'GET_COMPANY_STATS_SUCCESS';
export const GET_COMPANY_STATS_FAILURE = 'GET_COMPANY_STATS_FAILURE';

export interface GetCompanyStatsRequestAction {
  type: typeof GET_COMPANY_STATS_REQUEST;
}

export interface GetCompanyStatsSuccessAction {
  type: typeof GET_COMPANY_STATS_SUCCESS;
  payload: CompanyStats;
}

export interface GetCompanyStatsFailureAction {
  type: typeof GET_COMPANY_STATS_FAILURE;
  payload: string;
}

export type CompanyStatsActionTypes =
  | GetCompanyStatsRequestAction
  | GetCompanyStatsSuccessAction
  | GetCompanyStatsFailureAction;