import {
  ExecutiveOverviewState,
  ExecutiveOverviewActionTypes,
  GET_EXECUTIVE_OVERVIEW_REQUEST,
  GET_EXECUTIVE_OVERVIEW_SUCCESS,
  GET_EXECUTIVE_OVERVIEW_FAILURE,
} from "../types/getExecutiveOverviewAiTypes";

const initialState: ExecutiveOverviewState = {
  data: null,
  loading: false,
  error: null,
};

export const executiveOverviewReducer = (
  state = initialState,
  action: ExecutiveOverviewActionTypes
): ExecutiveOverviewState => {
  switch (action.type) {
    case GET_EXECUTIVE_OVERVIEW_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_EXECUTIVE_OVERVIEW_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      };
    case GET_EXECUTIVE_OVERVIEW_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: null,
      };
    default:
      return state;
  }
};