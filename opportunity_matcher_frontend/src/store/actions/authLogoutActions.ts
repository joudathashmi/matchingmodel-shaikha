import {
  LOGOUT_REQUEST,
  LOGOUT_SUCCESS,
  LOGOUT_FAILURE,
  LogoutRequestAction,
  LogoutSuccessAction,
  LogoutFailureAction
} from '../types/authLogoutTypes';

export const logoutRequest = (): LogoutRequestAction => ({
  type: LOGOUT_REQUEST
});

export const logoutSuccess = (message: string): LogoutSuccessAction => ({
  type: LOGOUT_SUCCESS,
  payload: { message }
});

export const logoutFailure = (error: string): LogoutFailureAction => ({
  type: LOGOUT_FAILURE,
  payload: { error }
});