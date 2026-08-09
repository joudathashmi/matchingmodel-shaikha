import { call, put, takeLatest } from "redux-saga/effects";
import {
  getCompaniesSuccess,
  getCompaniesFailure,
} from "../actions/actionCompanyActions";
import { actionCompanyService } from "../services/actionCompanyService";
import { Company, GET_COMPANIES } from "../types/actionCompanyTypes";

function* fetchCompaniesSaga() {
  try {
    const companies: Company[] = yield call(actionCompanyService.getCompanies);
    yield put(getCompaniesSuccess(companies));
  } catch (error: any) {
    yield put(getCompaniesFailure(error.message || "Something went wrong"));
  }
}

export function* watchCompanies() {
  yield takeLatest(GET_COMPANIES, fetchCompaniesSaga);
}
