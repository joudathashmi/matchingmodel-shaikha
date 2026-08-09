import { call, put, takeEvery } from "redux-saga/effects";
import {
  GET_DISCOVERY_OPPORTUNITIES,
  DiscoveryOpportunitiesRequest,
  DiscoveryOpportunitiesResponse,
} from "../types/discoverOpportunitiesTypes";
import {
  getDiscoveryOpportunitiesSuccess,
  getDiscoveryOpportunitiesFailure,
} from "../actions/discoverOpportunitiesActions";
import { discoveryOpportunitiesService } from "../services/discoverOpportunitiesService";

function* fetchDiscoveryOpportunitiesSaga(action: {
  type: string;
  payload: DiscoveryOpportunitiesRequest;
}) {
  try {
    const response: DiscoveryOpportunitiesResponse = yield call(
      discoveryOpportunitiesService.getDiscoveryOpportunities,
      action.payload
    );
    yield put(getDiscoveryOpportunitiesSuccess(response));
  } catch (error: any) {
    yield put(
      getDiscoveryOpportunitiesFailure(
        error.message || "Failed to fetch discovery opportunities"
      )
    );
  }
}

export function* discoveryOpportunitiesSaga() {
  yield takeEvery(GET_DISCOVERY_OPPORTUNITIES, fetchDiscoveryOpportunitiesSaga);
}