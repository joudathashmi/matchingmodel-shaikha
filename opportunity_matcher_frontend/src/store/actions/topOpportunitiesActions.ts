import {
  GET_TOP_OPPORTUNITIES,
  GET_TOP_OPPORTUNITIES_SUCCESS,
  GET_TOP_OPPORTUNITIES_FAILURE,
  TopOpportunitiesRequest,
  TopOpportunitiesResponse,
  TopOpportunitiesActionTypes
} from '../types/topOpportunitiesTypes';

export const getTopOpportunities = (payload: TopOpportunitiesRequest): TopOpportunitiesActionTypes => ({
  type: GET_TOP_OPPORTUNITIES,
  payload
});

export const getTopOpportunitiesSuccess = (payload: TopOpportunitiesResponse): TopOpportunitiesActionTypes => ({
  type: GET_TOP_OPPORTUNITIES_SUCCESS,
  payload
});

export const getTopOpportunitiesFailure = (payload: string): TopOpportunitiesActionTypes => ({
  type: GET_TOP_OPPORTUNITIES_FAILURE,
  payload
});
