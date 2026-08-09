import {
  OpportunitiesState,
  OpportunitiesActionTypes,
  GET_OPPORTUNITIES_LIST_REQUEST,
  GET_OPPORTUNITIES_LIST_SUCCESS,
  GET_OPPORTUNITIES_LIST_FAILURE,
  SET_OPPORTUNITIES_FILTERS
} from "../types/getopportunitiesListTypes";

const initialState: OpportunitiesState = {
  data: [],
  meta: null,
  loading: false,
  error: null,
  filters: {
    sectors: [],
    ai_score: { min: 0, max: 1 },
    investment_range: { min: 1, max: 1000000000},
    sort_by: "score",
    sort_order: "desc",
    page: 1,
    limit: 12,
  },
};

const opportunitiesReducer = (
  state = initialState,
  action: OpportunitiesActionTypes
): OpportunitiesState => {
  switch (action.type) {
    case GET_OPPORTUNITIES_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_OPPORTUNITIES_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload.data,
        meta: action.payload.meta,
        error: null,
      };

    case GET_OPPORTUNITIES_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: [],
        meta: null,
      };

    case SET_OPPORTUNITIES_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    default:
      return state;
  }
};

export default opportunitiesReducer;