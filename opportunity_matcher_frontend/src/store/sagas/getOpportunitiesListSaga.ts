import { call, put, takeEvery } from 'redux-saga/effects';
import { GET_OPPORTUNITIES_LIST_REQUEST } from '../types/getopportunitiesListTypes';
import { OpportunitiesListRequest, OpportunitiesResponse } from '../types/getopportunitiesListTypes';
import { opportunitiesService } from '../services/getOpportunitiesListService';
import { getOpportunitiesListFailure, getOpportunitiesListSuccess } from '../actions/getopportunitiesListActions';

function* fetchOpportunitiesListSaga(action: { type: string; payload: OpportunitiesListRequest }) {
  try {
    const response: OpportunitiesResponse = yield call(
      opportunitiesService.getOpportunitiesList,
      action.payload
    );
    yield put(getOpportunitiesListSuccess(response));
  } catch (error: any) {
    yield put(getOpportunitiesListFailure(error.message || 'Failed to fetch opportunities list'));
  }
}

export function* watchGetOpportunitiesList() {
  yield takeEvery(GET_OPPORTUNITIES_LIST_REQUEST, fetchOpportunitiesListSaga);
}