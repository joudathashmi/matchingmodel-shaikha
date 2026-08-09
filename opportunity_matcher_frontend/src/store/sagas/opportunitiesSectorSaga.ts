import { call, put, takeLatest } from "redux-saga/effects";
import {
  getOpportunitiesSectorCountsSuccess,
  getOpportunitiesSectorCountsFailure,
} from "../actions/opportunitiesSectorActions";
import { opportunitiesSectorService } from "../services/opportunitiesSectorService";
import { OpportunitiesSectorCount } from "../types/opportunitiesSectorTypes";
import { GET_OPPORTUNITIES_SECTOR_COUNTS } from "../types/opportunitiesSectorTypes";

function* fetchOpportunitiesSectorCountsSaga() {
  try {
    const sectorCounts: OpportunitiesSectorCount[] = yield call(
      opportunitiesSectorService.getSectorCounts
    );
    yield put(getOpportunitiesSectorCountsSuccess(sectorCounts));
  } catch (error: any) {
    yield put(getOpportunitiesSectorCountsFailure(error.message || "Something went wrong"));
  }
}

export function* watchOpportunitiesSectorCounts() {
  yield takeLatest(GET_OPPORTUNITIES_SECTOR_COUNTS, fetchOpportunitiesSectorCountsSaga);
}