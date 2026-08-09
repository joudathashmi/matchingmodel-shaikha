import {
  GET_OPPORTUNITY_DETAILS_REQUEST,
  GET_OPPORTUNITY_DETAILS_SUCCESS,
  GET_OPPORTUNITY_DETAILS_FAILURE,
  GetOpportunityDetailsRequestAction,
  GetOpportunityDetailsSuccessAction,
  GetOpportunityDetailsFailureAction
} from '../types/opportunitiesDetailsTypes';

export const getOpportunityDetailsRequest = (
  opportunityId: number, 
  aiDecision?: string
): GetOpportunityDetailsRequestAction => ({
  type: GET_OPPORTUNITY_DETAILS_REQUEST,
  payload: { opportunityId, aiDecision }
});

export const getOpportunityDetailsSuccess = (
  data: any
): GetOpportunityDetailsSuccessAction => ({
  type: GET_OPPORTUNITY_DETAILS_SUCCESS,
  payload: data
});

export const getOpportunityDetailsFailure = (
  error: string
): GetOpportunityDetailsFailureAction => ({
  type: GET_OPPORTUNITY_DETAILS_FAILURE,
  payload: error
});