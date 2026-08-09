import {
  GET_COMPANY_DETAILS_REQUEST,
  GET_COMPANY_DETAILS_SUCCESS,
  GET_COMPANY_DETAILS_FAILURE,
  SET_AI_DECISION_FILTER,
  CLEAR_COMPANY_DETAILS,
  CompanyDetailsActionTypes,
  GetCompanyDetailsRequestAction,
  GetCompanyDetailsSuccessAction,
  GetCompanyDetailsFailureAction,
  SetAiDecisionFilterAction,
  ClearCompanyDetailsAction
} from '../types/getCompanyDetailsTypes';

// Export the constants - MAKE SURE ALL ARE IMPORTED FIRST
export {
  GET_COMPANY_DETAILS_REQUEST,
  GET_COMPANY_DETAILS_SUCCESS,
  GET_COMPANY_DETAILS_FAILURE,
  SET_AI_DECISION_FILTER,
  CLEAR_COMPANY_DETAILS
};

// Updated action creator with proper typing
export const getCompanyDetailsRequest = (
  companyId: number, 
  aiDecision?: string
): GetCompanyDetailsRequestAction => {
  const payload: { companyId: number; aiDecision?: string } = { companyId };
  
  // Only include aiDecision if it's provided and not empty/'All'
  if (aiDecision && aiDecision !== '' && aiDecision !== 'All') {
    payload.aiDecision = aiDecision;
  }
  
  return {
    type: GET_COMPANY_DETAILS_REQUEST,
    payload: payload as { companyId: number; aiDecision: string }
  };
};

export const getCompanyDetailsSuccess = (companyDetails: any): GetCompanyDetailsSuccessAction => ({
  type: GET_COMPANY_DETAILS_SUCCESS,
  payload: companyDetails
});

export const getCompanyDetailsFailure = (error: string): GetCompanyDetailsFailureAction => ({
  type: GET_COMPANY_DETAILS_FAILURE,
  payload: error
});

export const setAiDecisionFilter = (filter: string): SetAiDecisionFilterAction => ({
  type: SET_AI_DECISION_FILTER,
  payload: filter
});

export const clearCompanyDetails = (): ClearCompanyDetailsAction => ({
  type: CLEAR_COMPANY_DETAILS
});