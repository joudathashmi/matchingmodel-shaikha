import {
  UserRoleState,
  UserRoleActionTypes,
  GET_USER_ROLE_REQUEST,
  GET_USER_ROLE_SUCCESS,
  GET_USER_ROLE_FAILURE,
} from "../types/getUserRoleTypes";

const initialState: UserRoleState = {
  loading: false,
  user: null,
  error: null,
};

const getUserRoleReducer = (
  state = initialState,
  action: UserRoleActionTypes
): UserRoleState => {
  switch (action.type) {
    case GET_USER_ROLE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_USER_ROLE_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        error: null,
      };
    case GET_USER_ROLE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        user: null,
      };
    default:
      return state;
  }
};

export default getUserRoleReducer;