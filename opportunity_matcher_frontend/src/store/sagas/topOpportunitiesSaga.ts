import { call, put, takeEvery } from 'redux-saga/effects';
import {
  GET_TOP_OPPORTUNITIES,
  TopOpportunitiesRequest,
  TopOpportunitiesResponse
} from '../types/topOpportunitiesTypes';
import {
  getTopOpportunitiesSuccess,
  getTopOpportunitiesFailure
} from '../actions/topOpportunitiesActions';
import { topOpportunitiesService } from '../services/topOpportunitiesService';

function* fetchTopOpportunitiesSaga(action: { type: string; payload: TopOpportunitiesRequest }) {
  try {
    const response: TopOpportunitiesResponse = yield call(topOpportunitiesService.getTopOpportunities, action.payload);
    yield put(getTopOpportunitiesSuccess(response));
  } catch (error: any) {
    yield put(getTopOpportunitiesFailure(error.message || 'Failed to fetch top opportunities'));
  }
}

export function* topOpportunitiesSaga() {
  yield takeEvery(GET_TOP_OPPORTUNITIES, fetchTopOpportunitiesSaga);
}
