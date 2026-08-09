// filterMatchesActions.ts

import {
  GET_ACTIVE_MATCHES,
  GET_ACTIVE_MATCHES_SUCCESS,
  GET_ACTIVE_MATCHES_FAILURE,
  ActiveMatchesRequest,
  ActiveMatchesResponse,
  ActiveMatchesActionTypes
} from '../types/filterMatchesTypes';

export const getActiveMatches = (payload: ActiveMatchesRequest): ActiveMatchesActionTypes => ({
  type: GET_ACTIVE_MATCHES,
  payload
});

export const getActiveMatchesSuccess = (payload: ActiveMatchesResponse): ActiveMatchesActionTypes => ({
  type: GET_ACTIVE_MATCHES_SUCCESS,
  payload
});

export const getActiveMatchesFailure = (payload: string): ActiveMatchesActionTypes => ({
  type: GET_ACTIVE_MATCHES_FAILURE,
  payload
});
