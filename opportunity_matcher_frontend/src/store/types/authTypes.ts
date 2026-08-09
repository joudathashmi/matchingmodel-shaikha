export const LOGIN_REQUEST = "LOGIN_REQUEST";
export const LOGIN_SUCCESS = "LOGIN_SUCCESS";
export const LOGIN_FAILURE = "LOGIN_FAILURE";
export const LOGOUT = "LOGOUT";
export const CLEAR_ERROR = "CLEAR_ERROR";
export const PASSWORD_CHANGED = "PASSWORD_CHANGED";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken?: string;
  token?: string;
  mustChangePassword?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
}
