import {
  CREATE_MATCH_AGREEMENT_REQUEST,
  CREATE_MATCH_AGREEMENT_SUCCESS,
  CREATE_MATCH_AGREEMENT_FAILURE,
  RESET_MATCH_AGREEMENT_STATE,
  CreateMatchAgreementRequest,
  MatchAgreementResponse,
} from "../types/CreateMatchAgreementTypes";

export const createMatchAgreementRequest = (data: CreateMatchAgreementRequest) => ({
  type: CREATE_MATCH_AGREEMENT_REQUEST,
  payload: data,
});

export const createMatchAgreementSuccess = (data: MatchAgreementResponse) => ({
  type: CREATE_MATCH_AGREEMENT_SUCCESS,
  payload: data,
});

export const createMatchAgreementFailure = (error: string) => ({
  type: CREATE_MATCH_AGREEMENT_FAILURE,
  payload: error,
});

export const resetMatchAgreementState = () => ({
  type: RESET_MATCH_AGREEMENT_STATE,
});