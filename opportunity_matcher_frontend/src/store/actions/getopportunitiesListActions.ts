import {
  GET_OPPORTUNITIES_LIST_REQUEST,
  GET_OPPORTUNITIES_LIST_SUCCESS,
  GET_OPPORTUNITIES_LIST_FAILURE,
  SET_OPPORTUNITIES_FILTERS,
  OpportunitiesFilters,
  OpportunitiesListRequest,
  OpportunitiesResponse
} from "../types/getopportunitiesListTypes";

export const getOpportunitiesListRequest = (request: OpportunitiesListRequest) => ({
  type: GET_OPPORTUNITIES_LIST_REQUEST,
  payload: request,
});

export const getOpportunitiesListSuccess = (response: OpportunitiesResponse) => ({
  type: GET_OPPORTUNITIES_LIST_SUCCESS,
  payload: response,
});

export const getOpportunitiesListFailure = (error: string) => ({
  type: GET_OPPORTUNITIES_LIST_FAILURE,
  payload: error,
});

export const setOpportunitiesFilters = (filters: OpportunitiesFilters) => ({
  type: SET_OPPORTUNITIES_FILTERS,
  payload: filters,
});