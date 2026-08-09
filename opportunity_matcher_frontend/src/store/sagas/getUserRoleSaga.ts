import { call, put, takeEvery } from "redux-saga/effects";
import {
  getUserRoleRequest,
  getUserRoleSuccess,
  getUserRoleFailure,
} from "../actions/getUserRoleActions";
import { getUserRoleService } from "../services/getUserRoleService";
import { GET_USER_ROLE_REQUEST } from "../types/getUserRoleTypes";

function* fetchUserRole(): Generator<any, void, any> {
  try {
    const response = yield call(getUserRoleService.getUser);
    yield put(getUserRoleSuccess(response.user));
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to fetch user data";
    yield put(getUserRoleFailure(errorMessage));
  }
}

export function* watchGetUserRole() {
  yield takeEvery(GET_USER_ROLE_REQUEST, fetchUserRole);
}