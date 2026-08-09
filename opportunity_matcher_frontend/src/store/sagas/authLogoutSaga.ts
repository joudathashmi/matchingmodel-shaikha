// sagas/authLogoutSaga.ts
import { call, put, takeLatest } from "redux-saga/effects";
import { LOGOUT_REQUEST } from "../types/authLogoutTypes";
import { logoutSuccess, logoutFailure } from "../actions/authLogoutActions";
import { logout } from "../services/authLogoutService";
import { logout as mainLogoutAction } from '../actions/authActions'; // Import the main logout action

function* handleLogout(): Generator<any, void, any> {
  try {
    // 1. Call the logout API
    yield call(logout);

    // 2. Clear token from localStorage - DO THIS FIRST
    localStorage.removeItem("token");

    // 3. Dispatch success action for the logout-specific state
    yield put(logoutSuccess("Logged out successfully"));

    // 4. 🔥 MOST IMPORTANT: Dispatch the main LOGOUT action 
    // to reset the central auth state (user, token, isAuthenticated)
    yield put(mainLogoutAction());

  } catch (error: any) {
    // Even if the API call fails, we must clear everything
    localStorage.removeItem("token");
    yield put(mainLogoutAction()); // Clear the main auth state on failure too

    const errorMessage = error.response?.data?.message ||
      error.message ||
      "Logout failed. Please try again.";
    yield put(logoutFailure(errorMessage));
  }
}

export function* authLogoutSaga() {
  yield takeLatest(LOGOUT_REQUEST, handleLogout);
}