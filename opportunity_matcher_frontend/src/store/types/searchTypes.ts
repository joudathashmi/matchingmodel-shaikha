import { SearchResult } from "../services/globalSearchService";

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

export const FETCH_SEARCH_REQUEST = "FETCH_SEARCH_REQUEST";
export const FETCH_SEARCH_SUCCESS = "FETCH_SEARCH_SUCCESS";
export const FETCH_SEARCH_FAILURE = "FETCH_SEARCH_FAILURE";

interface FetchSearchRequestAction {
  type: typeof FETCH_SEARCH_REQUEST;
  payload: { query: string };
}

interface FetchSearchSuccessAction {
  type: typeof FETCH_SEARCH_SUCCESS;
  payload: SearchResult[];
}

interface FetchSearchFailureAction {
  type: typeof FETCH_SEARCH_FAILURE;
  payload: string;
}

export type SearchActionTypes =
  | FetchSearchRequestAction
  | FetchSearchSuccessAction
  | FetchSearchFailureAction;

export type { SearchResult };