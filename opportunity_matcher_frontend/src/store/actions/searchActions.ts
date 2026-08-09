import {
  FETCH_SEARCH_REQUEST,
  FETCH_SEARCH_SUCCESS,
  FETCH_SEARCH_FAILURE,
  SearchActionTypes,
  SearchResult,
} from "../types/searchTypes";

export const fetchSearchRequest = (query: string): SearchActionTypes => ({
  type: FETCH_SEARCH_REQUEST,
  payload: { query },
});

export const fetchSearchSuccess = (results: SearchResult[]): SearchActionTypes => ({
  type: FETCH_SEARCH_SUCCESS,
  payload: results,
});

export const fetchSearchFailure = (error: string): SearchActionTypes => ({
  type: FETCH_SEARCH_FAILURE,
  payload: error,
});
