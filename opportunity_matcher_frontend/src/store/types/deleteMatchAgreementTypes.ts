export interface DeleteMatchAgreementRequest {
  matchId: number;
}

export interface DeleteMatchAgreementState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

// Action Types
export const DELETE_MATCH_AGREEMENT_REQUEST = "DELETE_MATCH_AGREEMENT_REQUEST";
export const DELETE_MATCH_AGREEMENT_SUCCESS = "DELETE_MATCH_AGREEMENT_SUCCESS";
export const DELETE_MATCH_AGREEMENT_FAILURE = "DELETE_MATCH_AGREEMENT_FAILURE";
export const DELETE_MATCH_AGREEMENT_RESET = "DELETE_MATCH_AGREEMENT_RESET";

// Action Interfaces
interface DeleteMatchAgreementRequestAction {
  type: typeof DELETE_MATCH_AGREEMENT_REQUEST;
}

interface DeleteMatchAgreementSuccessAction {
  type: typeof DELETE_MATCH_AGREEMENT_SUCCESS;
}

interface DeleteMatchAgreementFailureAction {
  type: typeof DELETE_MATCH_AGREEMENT_FAILURE;
  payload: string;
}

interface DeleteMatchAgreementResetAction {
  type: typeof DELETE_MATCH_AGREEMENT_RESET;
}

export type DeleteMatchAgreementActionTypes =
  | DeleteMatchAgreementRequestAction
  | DeleteMatchAgreementSuccessAction
  | DeleteMatchAgreementFailureAction
  | DeleteMatchAgreementResetAction;