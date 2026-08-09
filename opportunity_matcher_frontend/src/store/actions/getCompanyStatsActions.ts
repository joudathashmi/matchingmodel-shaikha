import {
  GET_COMPANY_STATS_REQUEST,
  GET_COMPANY_STATS_SUCCESS,
  GET_COMPANY_STATS_FAILURE,
  CompanyStats
} from '../types/getCompanyStatsTypes';

export const getCompanyStatsRequest = () => ({
  type: GET_COMPANY_STATS_REQUEST as typeof GET_COMPANY_STATS_REQUEST
});

export const getCompanyStatsSuccess = (data: CompanyStats) => ({
  type: GET_COMPANY_STATS_SUCCESS as typeof GET_COMPANY_STATS_SUCCESS,
  payload: data
});

export const getCompanyStatsFailure = (error: string) => ({
  type: GET_COMPANY_STATS_FAILURE as typeof GET_COMPANY_STATS_FAILURE,
  payload: error
});