// store/sagas/discoverSectorCountSaga.ts

import { call, put, takeLatest } from "redux-saga/effects";
import {
  getDiscoverSectorCountSuccess,
  getDiscoverSectorCountFailure,
} from "../actions/discoverSectorCountActions";
import { discoverSectorCountService } from "../services/discoverSectorCountServices";
import { GET_DISCOVER_SECTOR_COUNT_REQUEST } from "../types/discoverSectorCountTypes";

function* handleGetDiscoverSectorCount(): Generator<any, void, any> {
  try {
    console.log("⚡ Saga: Fetching sector counts...");
    
    const data = yield call(discoverSectorCountService.getSectorCounts);
    
    console.log("Sector counts received:", data);
    
    yield put(getDiscoverSectorCountSuccess(data));
  } catch (error: any) {
    console.error("Error in saga fetching sector counts:", error);
    yield put(getDiscoverSectorCountFailure(error.message));
  }
}

export function* discoverSectorCountSaga() {
  yield takeLatest(GET_DISCOVER_SECTOR_COUNT_REQUEST, handleGetDiscoverSectorCount);
}