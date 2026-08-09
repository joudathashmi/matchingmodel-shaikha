import { call, put, takeEvery } from 'redux-saga/effects';
import { GET_COMPANIES_LIST } from '../types/companiesListTypes';
import { getCompaniesListSuccess, getCompaniesListFailure } from '../actions/companiesListActions';
import { companiesListService } from '../services/companiesListService';
import { CompaniesListRequest, CompaniesListResponse } from '../types/companiesListTypes';

function* fetchCompaniesListSaga(action: { type: string; payload: CompaniesListRequest }) {
  try {
    const response: CompaniesListResponse = yield call(
      companiesListService.getCompaniesList,
      action.payload
    );
    yield put(getCompaniesListSuccess(response));
  } catch (error: any) {
    yield put(getCompaniesListFailure(error.message || 'Failed to fetch companies list'));
  }
}

export function* companiesListSaga() {
  yield takeEvery(GET_COMPANIES_LIST, fetchCompaniesListSaga);
}