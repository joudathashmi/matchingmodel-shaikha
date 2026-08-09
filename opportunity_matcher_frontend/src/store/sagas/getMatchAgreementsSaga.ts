import { call, put, takeEvery } from "redux-saga/effects";
import {
  getMatchAgreementsRequest,
  getMatchAgreementsSuccess,
  getMatchAgreementsFailure,
} from "../actions/getMatchAgreementsActions";
import { getMatchAgreementsService } from "../services/getMatchAgreementsService";
import { GET_MATCH_AGREEMENTS_REQUEST } from "../types/getMatchAgreementsTypes";

function* fetchMatchAgreementsSaga(): Generator<any, void, any> {
  try {
    // Admin Match Agreement page needs the full team list
    const response = yield call(getMatchAgreementsService.getMatchAgreements, {
      scope: "all",
    });
    const list = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];
    yield put(getMatchAgreementsSuccess(list));
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch match agreements";
    yield put(getMatchAgreementsFailure(errorMessage));
  }
}

export function* watchGetMatchAgreements() {
  yield takeEvery(GET_MATCH_AGREEMENTS_REQUEST, fetchMatchAgreementsSaga);
}