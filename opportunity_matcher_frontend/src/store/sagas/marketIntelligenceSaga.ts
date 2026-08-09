import { call, put, takeEvery } from "redux-saga/effects";
import {
  GET_MARKET_INTELLIGENCE_REQUEST,
} from "../types/MarketIntelligenceTypes";
import {
  getMarketIntelligenceSuccess,
  getMarketIntelligenceFailure,
} from "../actions/marketIntelligenceActions";
import { marketIntelligenceService, MarketIntelligenceResponse } from "../services/marketIntelligenceService";

function* getMarketIntelligenceSaga(): Generator<any, void, MarketIntelligenceResponse> {
  try {
    const marketIntelligence = yield call(
      marketIntelligenceService.getMarketIntelligence
    );

    yield put(getMarketIntelligenceSuccess(marketIntelligence));
  } catch (error: any) {
    yield put(getMarketIntelligenceFailure(error.message));
  }
}

export function* watchGetMarketIntelligence() {
  yield takeEvery(
    GET_MARKET_INTELLIGENCE_REQUEST,
    getMarketIntelligenceSaga as any
  );
}
