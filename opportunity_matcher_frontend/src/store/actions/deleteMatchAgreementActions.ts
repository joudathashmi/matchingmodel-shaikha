import {
  DELETE_MATCH_AGREEMENT_REQUEST,
  DELETE_MATCH_AGREEMENT_SUCCESS,
  DELETE_MATCH_AGREEMENT_FAILURE,
  DELETE_MATCH_AGREEMENT_RESET,
  DeleteMatchAgreementRequest,
} from "../types/deleteMatchAgreementTypes";

// Action Creators
export const deleteMatchAgreementRequest = (requestData: DeleteMatchAgreementRequest) => ({
  type: DELETE_MATCH_AGREEMENT_REQUEST,
  payload: requestData,
});

export const deleteMatchAgreementSuccess = () => ({
  type: DELETE_MATCH_AGREEMENT_SUCCESS,
});

export const deleteMatchAgreementFailure = (error: string) => ({
  type: DELETE_MATCH_AGREEMENT_FAILURE,
  payload: error,
});

export const deleteMatchAgreementReset = () => ({
  type: DELETE_MATCH_AGREEMENT_RESET,
});