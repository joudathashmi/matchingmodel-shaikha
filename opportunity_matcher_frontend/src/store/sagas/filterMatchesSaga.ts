// filterMatchesSaga.ts

import { call, put, takeEvery } from 'redux-saga/effects';
import {
  GET_ACTIVE_MATCHES,
  ActiveMatchesRequest,
  ActiveMatchesResponse
} from '../types/filterMatchesTypes';
import {
  getActiveMatchesSuccess,
  getActiveMatchesFailure
} from '../actions/filterMatchesActions';
import { activeMatchesService } from '../services/filterMatchesService';

function* fetchActiveMatchesSaga(action: { type: string; payload: ActiveMatchesRequest }) {
  try {
    const response: ActiveMatchesResponse = yield call(activeMatchesService.getActiveMatches, action.payload);
    yield put(getActiveMatchesSuccess(response));
  } catch (error: any) {
    yield put(getActiveMatchesFailure(error.message || 'Failed to fetch active matches'));
  }
}

export function* activeMatchesSaga() {
  yield takeEvery(GET_ACTIVE_MATCHES, fetchActiveMatchesSaga);
}
