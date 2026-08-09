import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  PASSWORD_CHANGED,
  User,
} from "../types/authTypes";

export const loginRequest = (email: string, password: string) => ({
  type: LOGIN_REQUEST,
  payload: { email, password },
});

export const loginSuccess = (
  user: User,
  token: string,
  mustChangePassword = false
) => ({
  type: LOGIN_SUCCESS,
  payload: { user, token, mustChangePassword },
});

export const loginFailure = (error: string) => ({
  type: LOGIN_FAILURE,
  payload: error,
});

export const logout = () => ({
  type: LOGOUT,
});

export const clearError = () => ({
  type: CLEAR_ERROR,
});

export const passwordChanged = () => ({
  type: PASSWORD_CHANGED,
});
