import { call, put, takeLatest } from "redux-saga/effects";
import { LOGIN_REQUEST } from "../types/authTypes";
import {
  loginSuccess,
  loginFailure
} from "../actions/authActions";
import { login } from "../services/authService";

function* handleLogin(action: any): Generator<any, void, any> {
  try {
    const { email, password } = action.payload;
    const response = yield call(login, email, password);
    
    const token = response.accessToken || response.token;
    const mustChangePassword = Boolean(
      response.mustChangePassword ?? response.user?.mustChangePassword
    );
    localStorage.setItem("token", token);
    yield put(loginSuccess(response.user, token, mustChangePassword));
  } catch (error: any) {
    // Extract error message from API response
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Login failed. Please try again.";
    
    yield put(loginFailure(errorMessage));
  }
}

export function* authSaga() {
  yield takeLatest(LOGIN_REQUEST, handleLogin);
}