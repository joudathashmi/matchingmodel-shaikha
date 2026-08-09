import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  PASSWORD_CHANGED,
  AuthState,
} from "../types/authTypes";

const readMustChange = () =>
  localStorage.getItem("mustChangePassword") === "true";

const initialState: AuthState = {
  user: null,
  token: (() => {
    const t = localStorage.getItem("token");
    if (t && t.split(".").length !== 3) {
      localStorage.removeItem("token");
      return null;
    }
    return t;
  })(),
  loading: false,
  error: null,
  isAuthenticated: false,
  mustChangePassword: readMustChange(),
};

initialState.isAuthenticated = !!initialState.token;

const authReducer = (state = initialState, action: any): AuthState => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return { ...state, loading: true, error: null };

    case LOGIN_SUCCESS: {
      const must =
        Boolean(action.payload.mustChangePassword) ||
        Boolean(action.payload.user?.mustChangePassword);
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("mustChangePassword", must ? "true" : "false");
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        mustChangePassword: must,
        error: null,
      };
    }

    case LOGIN_FAILURE:
      localStorage.removeItem("token");
      localStorage.removeItem("mustChangePassword");
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null,
        mustChangePassword: false,
      };

    case PASSWORD_CHANGED:
      localStorage.setItem("mustChangePassword", "false");
      return {
        ...state,
        mustChangePassword: false,
        user: state.user
          ? { ...state.user, mustChangePassword: false }
          : state.user,
      };

    case LOGOUT:
      localStorage.removeItem("token");
      localStorage.removeItem("mustChangePassword");
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        mustChangePassword: false,
        error: null,
      };

    case CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

export default authReducer;
