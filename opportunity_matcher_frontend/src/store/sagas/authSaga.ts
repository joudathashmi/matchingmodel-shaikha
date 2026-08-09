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
    
    // Save token
    localStorage.setItem("token", response.accessToken || response.token);
    
    yield put(loginSuccess(response.user, response.accessToken || response.token));
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