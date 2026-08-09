import { call, put, takeEvery } from "redux-saga/effects";
import {
  createMatchAgreementSuccess,
  createMatchAgreementFailure,
} from "../actions/CreateMatchAgreementActions";
import { matchAgreementService } from "../services/CreateMatchAgreementService";
import { CREATE_MATCH_AGREEMENT_REQUEST } from "../types/CreateMatchAgreementTypes";
import { CreateMatchAgreementRequest, MatchAgreementResponse } from "../types/CreateMatchAgreementTypes";

function* createMatchAgreementSaga(action: { type: string; payload: CreateMatchAgreementRequest }) {
  try {
    const response: MatchAgreementResponse = yield call(
      matchAgreementService.createMatchAgreement,
      action.payload
    );
    
    yield put(createMatchAgreementSuccess(response));
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to create match agreement";
    yield put(createMatchAgreementFailure(errorMessage));
  }
}

export function* watchCreateMatchAgreement() {
  yield takeEvery(CREATE_MATCH_AGREEMENT_REQUEST, createMatchAgreementSaga);
}