import {
  TopOpportunitiesState,
  TopOpportunitiesActionTypes,
  GET_TOP_OPPORTUNITIES,
  GET_TOP_OPPORTUNITIES_SUCCESS,
  GET_TOP_OPPORTUNITIES_FAILURE
} from '../types/topOpportunitiesTypes';

const initialState: TopOpportunitiesState = {
  topOpportunities: [],
  loading: false,
  error: null,
  meta: { total: 0, page: 1, limit: 5, totalPages: 0, sectors: [] }
};

export const topOpportunitiesReducer = (
  state = initialState,
  action: TopOpportunitiesActionTypes
): TopOpportunitiesState => {
  switch (action.type) {
    case GET_TOP_OPPORTUNITIES:
      return { ...state, loading: true, error: null };
    case GET_TOP_OPPORTUNITIES_SUCCESS:
      return { ...state, loading: false, topOpportunities: action.payload.data, meta: action.payload.meta };
    case GET_TOP_OPPORTUNITIES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
