import { call, put, takeEvery } from "redux-saga/effects";
import { deleteMatchAgreementService } from "../services/deleteMatchAgreementService";
import {
  deleteMatchAgreementSuccess,
  deleteMatchAgreementFailure,
} from "../actions/deleteMatchAgreementActions";
import { DELETE_MATCH_AGREEMENT_REQUEST } from "../types/deleteMatchAgreementTypes";
import { DeleteMatchAgreementRequest } from "../types/deleteMatchAgreementTypes";

function* deleteMatchAgreementSaga(action: { type: string; payload: DeleteMatchAgreementRequest }) {
  try {
    yield call(deleteMatchAgreementService.deleteMatchAgreement, action.payload);
    yield put(deleteMatchAgreementSuccess());
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Failed to delete match agreement";
    yield put(deleteMatchAgreementFailure(errorMessage));
  }
}

export function* watchDeleteMatchAgreement() {
  yield takeEvery(DELETE_MATCH_AGREEMENT_REQUEST, deleteMatchAgreementSaga);
}