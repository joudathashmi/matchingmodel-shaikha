import {
  SearchState,
  SearchActionTypes,
  FETCH_SEARCH_REQUEST,
  FETCH_SEARCH_SUCCESS,
  FETCH_SEARCH_FAILURE,
} from "../types/searchTypes";

const initialState: SearchState = {
  query: "",
  results: [],
  loading: false,
  error: null,
};

export const searchReducer = (
  state = initialState,
  action: SearchActionTypes
): SearchState => {
  switch (action.type) {
    case FETCH_SEARCH_REQUEST:
      return { ...state, loading: true, query: action.payload.query, error: null };

    case FETCH_SEARCH_SUCCESS:
      return { ...state, loading: false, results: action.payload };

    case FETCH_SEARCH_FAILURE:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};
