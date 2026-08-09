// types/authLogoutTypes.ts
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE';

export interface LogoutRequestAction {
  type: typeof LOGOUT_REQUEST;
  [key: string]: unknown; // Add index signature
}

export interface LogoutSuccessAction {
  type: typeof LOGOUT_SUCCESS;
  payload: { message: string };
  [key: string]: unknown; // Add index signature
}

export interface LogoutFailureAction {
  type: typeof LOGOUT_FAILURE;
  payload: { error: string };
  [key: string]: unknown; // Add index signature
}

export type LogoutActionTypes = 
  | LogoutRequestAction
  | LogoutSuccessAction
  | LogoutFailureAction;