import { call, put, takeEvery } from 'redux-saga/effects';
import { getCompanyStatsService } from '../services/getCompanyStatsService';
import {
  getCompanyStatsSuccess,
  getCompanyStatsFailure
} from '../actions/getCompanyStatsActions';
import { GET_COMPANY_STATS_REQUEST } from '../types/getCompanyStatsTypes';
import { CompanyStats } from '../types/getCompanyStatsTypes';

function* getCompanyStatsSaga(): Generator<any, void, CompanyStats> {
  try {
    const data = yield call(getCompanyStatsService.getCompanyStats);
    yield put(getCompanyStatsSuccess(data));
  } catch (error: any) {
    yield put(getCompanyStatsFailure(error.message));
  }
}

export function* watchGetCompanyStats() {
  yield takeEvery(GET_COMPANY_STATS_REQUEST, getCompanyStatsSaga);
}