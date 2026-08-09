  // Response types
  export interface User {
  id: string;
  name: string;
  email: string;
}
  export interface Match {
    id: number;
    opportunity_id: number;
    opportunity_name: string;
    opportunity_sector: string;
    opportunity_url: string;
    company_id: number;
    company_name: string;
    company_sector: string;
    company_url: string;
  }

  export interface MatchAgreement {
    id: number;
    status: string;
    createdAt: string;
     user: User;
     match: Match;
  }

  export interface GetMatchAgreementsResponse {
    data: MatchAgreement[];
  }

  // Redux state types
  export interface GetMatchAgreementsState {
    data: MatchAgreement[];
    loading: boolean;
    error: string | null;
  }

  // Action types
  export const GET_MATCH_AGREEMENTS_REQUEST = 'GET_MATCH_AGREEMENTS_REQUEST';
  export const GET_MATCH_AGREEMENTS_SUCCESS = 'GET_MATCH_AGREEMENTS_SUCCESS';
  export const GET_MATCH_AGREEMENTS_FAILURE = 'GET_MATCH_AGREEMENTS_FAILURE';

  interface GetMatchAgreementsRequestAction {
    type: typeof GET_MATCH_AGREEMENTS_REQUEST;
  }

  interface GetMatchAgreementsSuccessAction {
    type: typeof GET_MATCH_AGREEMENTS_SUCCESS;
    payload: MatchAgreement[];
  }

  interface GetMatchAgreementsFailureAction {
    type: typeof GET_MATCH_AGREEMENTS_FAILURE;
    payload: string;
  }

  export type GetMatchAgreementsActionTypes = 
    | GetMatchAgreementsRequestAction
    | GetMatchAgreementsSuccessAction
    | GetMatchAgreementsFailureAction;