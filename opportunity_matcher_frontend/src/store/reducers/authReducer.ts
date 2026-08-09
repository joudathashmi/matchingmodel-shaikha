import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  AuthState
} from "../types/authTypes";

const initialState: AuthState = {
  user: null,
  token: (() => {
    const t = localStorage.getItem("token");
    // Drop legacy / remote tokens that are not JWTs (causes "jwt malformed")
    if (t && t.split(".").length !== 3) {
      localStorage.removeItem("token");
      return null;
    }
    return t;
  })(),
  loading: false,
  error: null,
  isAuthenticated: false,
};

initialState.isAuthenticated = !!initialState.token;

const authReducer = (state = initialState, action: any): AuthState => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, loading: true, error: null };

    case LOGIN_SUCCESS:
      localStorage.setItem("token", action.payload.token);
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };

    case LOGIN_FAILURE:
      localStorage.removeItem("token");
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null
      };

    case LOGOUT:
      localStorage.removeItem("token");
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      };

    case CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

export default authReducer;