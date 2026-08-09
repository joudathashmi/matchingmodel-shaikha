import { call, put, takeLatest } from "redux-saga/effects";
import {
  FETCH_SEARCH_REQUEST,
  SearchActionTypes,
} from "../types/searchTypes";
import { globalSearchService } from "../services/globalSearchService";
import { fetchSearchSuccess, fetchSearchFailure } from "../actions/searchActions";

function* fetchSearchSaga(action: SearchActionTypes): any {
  if (action.type !== FETCH_SEARCH_REQUEST) return;

  try {
    const { query } = action.payload;
    const data = yield call(globalSearchService.search, query);
    yield put(fetchSearchSuccess(Array.isArray(data?.results) ? data.results : []));
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Search failed";
    yield put(fetchSearchFailure(message));
  }
}

export function* watchSearchSaga() {
  yield takeLatest(FETCH_SEARCH_REQUEST, fetchSearchSaga);
}
