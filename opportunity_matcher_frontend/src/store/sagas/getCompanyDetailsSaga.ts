import { call, put, takeEvery } from 'redux-saga/effects';
import {
  getCompanyDetailsSuccess,
  getCompanyDetailsFailure,
  GET_COMPANY_DETAILS_REQUEST // Now this will work
} from '../actions/getCompanyDetailsActions'; // Import from actions
import { companyService } from '../services/getCompanyDetailService';
import { GetCompanyDetailsRequestAction } from '../types/getCompanyDetailsTypes'; // Only import types
import { CompanyDetailsApiResponse } from '../types/getCompanyDetailsTypes';

function* fetchCompanyDetails(action: GetCompanyDetailsRequestAction): Generator<any, void, CompanyDetailsApiResponse> {
  try {
    const { companyId, aiDecision } = action.payload;
    const response: CompanyDetailsApiResponse = yield call(companyService.getCompanyDetails, companyId, aiDecision);
    yield put(getCompanyDetailsSuccess(response.company));
  } catch (error: any) {
    yield put(getCompanyDetailsFailure(error.message || 'Failed to fetch company details'));
  }
}

export function* watchGetCompanyDetails() {
  yield takeEvery(GET_COMPANY_DETAILS_REQUEST, fetchCompanyDetails);
}