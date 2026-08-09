import { call, put, takeEvery } from "redux-saga/effects";
import { GET_OPPORTUNITY_MI_REQUEST } from "../types/opportunityMarketIntelligenceTypes";
import {
  getOpportunityMISuccess,
  getOpportunityMIFailure,
} from "../actions/opportunityMarketIntelligenceActions";
import {
  opportunityMarketIntelligenceService,
  OpportunityMIResponse,
} from "../services/opportunityMarketIntelligenceService";

function* getOpportunityMISaga(): Generator<any, void, OpportunityMIResponse> {
  try {
    const payload = yield call(opportunityMarketIntelligenceService.getOpportunityMI);
    yield put(getOpportunityMISuccess(payload));
  } catch (error: any) {
    yield put(getOpportunityMIFailure(error.message));
  }
}

export function* watchGetOpportunityMI() {
  yield takeEvery(GET_OPPORTUNITY_MI_REQUEST, getOpportunityMISaga as any);
}
