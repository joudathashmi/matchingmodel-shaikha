import {
  GET_COMPANIES_LIST,
  GET_COMPANIES_LIST_SUCCESS,
  GET_COMPANIES_LIST_FAILURE,
  SET_COMPANIES_LIST_FILTERS,
  CompaniesListRequest,
  CompaniesListResponse,
  CompaniesListFilters
} from '../types/companiesListTypes';

export const getCompaniesList = (request: CompaniesListRequest) => ({
  type: GET_COMPANIES_LIST,
  payload: request,
});

export const getCompaniesListSuccess = (response: CompaniesListResponse) => ({
  type: GET_COMPANIES_LIST_SUCCESS,
  payload: response,
});

export const getCompaniesListFailure = (error: string) => ({
  type: GET_COMPANIES_LIST_FAILURE,
  payload: error,
});

export const setCompaniesListFilters = (filters: CompaniesListFilters) => ({
  type: SET_COMPANIES_LIST_FILTERS,
  payload: filters,
});