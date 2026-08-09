import { call, put, takeEvery } from "redux-saga/effects";
import { GET_EXECUTIVE_OVERVIEW_REQUEST } from "../types/getExecutiveOverviewAiTypes";
import { 
  getExecutiveOverviewSuccess, 
  getExecutiveOverviewFailure 
} from "../actions/getExecutiveOverviewAiActions";
import { executiveOverviewService } from "../services/getExecutiveOverviewAiService";

function* fetchExecutiveOverviewData(): any {
  try {
    const data = yield call(executiveOverviewService.getExecutiveOverviewData);
    yield put(getExecutiveOverviewSuccess(data));
  } catch (error: any) {
    yield put(
      getExecutiveOverviewFailure(
        error.response?.data?.message || "Failed to fetch executive overview data"
      )
    );
  }
}

export function* watchGetExecutiveOverview() {
  yield takeEvery(GET_EXECUTIVE_OVERVIEW_REQUEST, fetchExecutiveOverviewData);
}