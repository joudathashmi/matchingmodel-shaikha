import { call, put, takeLatest } from "redux-saga/effects";
import {
  getAnalyticsSuccess,
  getAnalyticsFailure,
} from "../actions/analyticsActions";
import { analyticsService, AnalyticsResponse } from "../services/analyticsService";
import { GET_ANALYTICS } from "../types/analyticsTypes";

function* fetchAnalyticsSaga() {
  try {
    const analyticsData: AnalyticsResponse = yield call(
      analyticsService.getAnalytics
    );
    yield put(getAnalyticsSuccess(analyticsData));
  } catch (error: any) {
    yield put(getAnalyticsFailure(error.message || "Something went wrong"));
  }
}

export function* watchAnalytics() {
  yield takeLatest(GET_ANALYTICS, fetchAnalyticsSaga);
}
