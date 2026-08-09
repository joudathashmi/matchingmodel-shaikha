import { call, put, takeEvery } from 'redux-saga/effects';
import {
  GET_OPPORTUNITY_DETAILS_REQUEST,
  GetOpportunityDetailsRequestAction,
  OpportunityDetailsResponse
} from '../types/opportunitiesDetailsTypes';
import {
  getOpportunityDetailsSuccess,
  getOpportunityDetailsFailure
} from '../actions/opportunityDetailsActions';
import { getOpportunityDetails } from '../services/opportunityDetailsService';

function* fetchOpportunityDetails(action: GetOpportunityDetailsRequestAction): Generator<any, void, OpportunityDetailsResponse> {
  try {
    const { opportunityId, aiDecision } = action.payload;
    const data = yield call(getOpportunityDetails, opportunityId, aiDecision);
    yield put(getOpportunityDetailsSuccess(data));
  } catch (error: any) {
    yield put(getOpportunityDetailsFailure(error.message || 'Failed to fetch opportunity details'));
  }
}

export function* watchGetOpportunityDetails() {
  yield takeEvery(GET_OPPORTUNITY_DETAILS_REQUEST, fetchOpportunityDetails);
}