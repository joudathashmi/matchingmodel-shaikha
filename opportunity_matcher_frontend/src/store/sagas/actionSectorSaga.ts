// actionSectorSaga.ts
import { call, put, takeLatest } from "redux-saga/effects";
import {
  getSectorCounts,
  getSectorCountsSuccess,
  getSectorCountsFailure,
} from "../actions/actionSectorActions";
import { actionSectorService } from "../services/actionSectorService";
import { SectorCount } from "../types/actionSectorTypes";
import { GET_SECTOR_COUNTS } from "../types/actionSectorTypes";

function* fetchSectorCountsSaga() {
  try {
    const sectorCounts: SectorCount[] = yield call(
      actionSectorService.getSectorCounts
    );
    yield put(getSectorCountsSuccess(sectorCounts));
  } catch (error: any) {
    yield put(getSectorCountsFailure(error.message || "Something went wrong"));
  }
}

export function* watchSectorCounts() {
  yield takeLatest(GET_SECTOR_COUNTS, fetchSectorCountsSaga);
}
