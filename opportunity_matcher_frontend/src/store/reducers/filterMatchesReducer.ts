// filterMatchesReducer.ts

import {
  ActiveMatchesState,
  ActiveMatchesActionTypes,
  GET_ACTIVE_MATCHES,
  GET_ACTIVE_MATCHES_SUCCESS,
  GET_ACTIVE_MATCHES_FAILURE
} from '../types/filterMatchesTypes';

const initialState: ActiveMatchesState = {
  activeMatches: [],
  loading: false,
  error: null,
  meta: { total: 0, page: 1, limit: 5, totalPages: 0, sectors: [], companies: [] }
};

export const activeMatchesReducer = (
  state = initialState,
  action: ActiveMatchesActionTypes
): ActiveMatchesState => {
  switch (action.type) {
    case GET_ACTIVE_MATCHES:
      return { ...state, loading: true, error: null };
    case GET_ACTIVE_MATCHES_SUCCESS:
      return { ...state, loading: false, activeMatches: action.payload.data, meta: action.payload.meta };
    case GET_ACTIVE_MATCHES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
