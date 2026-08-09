import {
  LOGOUT_REQUEST,
  LOGOUT_SUCCESS,
  LOGOUT_FAILURE
} from '../types/authLogoutTypes';

interface LogoutState {
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: LogoutState = {
  loading: false,
  error: null,
  message: null
};


const authLogoutReducer = (state = initialState, action: any): LogoutState => {
  switch (action.type) {
    case LOGOUT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };

    case LOGOUT_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload.message,
        error: null
      };

    case LOGOUT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        message: null
      };

    // Add a reset action
    case 'LOGOUT_RESET':
      return initialState;

    default:
      return state;
  }
};

export default authLogoutReducer;