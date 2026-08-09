// sagas/authLogoutSaga.ts
import { call, put, takeLatest } from "redux-saga/effects";
import { LOGOUT_REQUEST } from "../types/authLogoutTypes";
import { logoutSuccess } from "../actions/authLogoutActions";
import { logout } from "../services/authLogoutService";
import { logout as mainLogoutAction } from "../actions/authActions";

function* handleLogout(): Generator<any, void, any> {
  // Clear local session and finish the UI immediately.
  localStorage.removeItem("token");
  yield put(mainLogoutAction());
  yield put(logoutSuccess("Logged out successfully"));

  // Best-effort server revoke (must not block the desk).
  try {
    yield call(logout);
  } catch {
    // Ignore: local logout already succeeded.
  }
}

export function* authLogoutSaga() {
  yield takeLatest(LOGOUT_REQUEST, handleLogout);
}
