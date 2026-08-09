import { call, put, takeEvery } from 'redux-saga/effects';
import {
  GET_SECTOR_COUNTS_REQUEST,
  SectorCount
} from '../types/sectorCountsTypes';
import {
  getSectorCountsSuccess,
  getSectorCountsFailure
} from '../actions/sectorCountsActions';
import { sectorCountsService } from '../services/sectorCountsService';

function* getSectorCountsSaga(): Generator<any, void, SectorCount[]> {
  try {
    const sectorCounts = yield call(
      sectorCountsService.getSectorCounts
    );

    yield put(getSectorCountsSuccess(sectorCounts));
  } catch (error: any) {
    yield put(getSectorCountsFailure(error.message));
  }
}

export function* watchGetSectorCounts() {
  yield takeEvery(GET_SECTOR_COUNTS_REQUEST, getSectorCountsSaga as any);
}
