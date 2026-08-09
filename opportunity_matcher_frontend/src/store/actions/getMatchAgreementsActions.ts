import {
  GET_MATCH_AGREEMENTS_REQUEST,
  GET_MATCH_AGREEMENTS_SUCCESS,
  GET_MATCH_AGREEMENTS_FAILURE,
  MatchAgreement,
} from "../types/getMatchAgreementsTypes";

export const getMatchAgreementsRequest = () => ({
  type: GET_MATCH_AGREEMENTS_REQUEST,
});

export const getMatchAgreementsSuccess = (data: MatchAgreement[]) => ({
  type: GET_MATCH_AGREEMENTS_SUCCESS,
  payload: data,
});

export const getMatchAgreementsFailure = (error: string) => ({
  type: GET_MATCH_AGREEMENTS_FAILURE,
  payload: error,
});