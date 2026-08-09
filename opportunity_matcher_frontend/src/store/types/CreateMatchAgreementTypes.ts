// Request types
export interface CreateMatchAgreementRequest {
  matchId: number;
  status:
    | "Agreed"
    | "Disagreed"
    | "Engage"
    | "PlanShared"
    | "MoU"
    | "Landed"
    | "Hold"
    | "Rejected";
}

// Response types
export interface MatchAgreementResponse {
  id: number;
  userId: string;
  matchId: number;
  status: string;
  createdAt: string;
}

// State types
export interface MatchAgreementState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: MatchAgreementResponse | null;
}

// Action types
export const CREATE_MATCH_AGREEMENT_REQUEST = "CREATE_MATCH_AGREEMENT_REQUEST";
export const CREATE_MATCH_AGREEMENT_SUCCESS = "CREATE_MATCH_AGREEMENT_SUCCESS";
export const CREATE_MATCH_AGREEMENT_FAILURE = "CREATE_MATCH_AGREEMENT_FAILURE";
export const RESET_MATCH_AGREEMENT_STATE = "RESET_MATCH_AGREEMENT_STATE";

interface CreateMatchAgreementRequestAction {
  type: typeof CREATE_MATCH_AGREEMENT_REQUEST;
}

interface CreateMatchAgreementSuccessAction {
  type: typeof CREATE_MATCH_AGREEMENT_SUCCESS;
  payload: MatchAgreementResponse;
}

interface CreateMatchAgreementFailureAction {
  type: typeof CREATE_MATCH_AGREEMENT_FAILURE;
  payload: string;
}

interface ResetMatchAgreementStateAction {
  type: typeof RESET_MATCH_AGREEMENT_STATE;
}

export type MatchAgreementActionTypes =
  | CreateMatchAgreementRequestAction
  | CreateMatchAgreementSuccessAction
  | CreateMatchAgreementFailureAction
  | ResetMatchAgreementStateAction;