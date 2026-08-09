import {
  DiscoveryOpportunitiesState,
  DiscoveryOpportunitiesActionTypes,
  GET_DISCOVERY_OPPORTUNITIES,
  GET_DISCOVERY_OPPORTUNITIES_SUCCESS,
  GET_DISCOVERY_OPPORTUNITIES_FAILURE,
} from "../types/discoverOpportunitiesTypes";

const initialState: DiscoveryOpportunitiesState = {
  opportunities: [],
  loading: false,
  error: null,
  meta: { total: 0, page: 1, limit: 10, totalPages: 0, sectors: [] },
};

export const discoveryOpportunitiesReducer = (
  state = initialState,
  action: DiscoveryOpportunitiesActionTypes
): DiscoveryOpportunitiesState => {
  switch (action.type) {
    case GET_DISCOVERY_OPPORTUNITIES:
      return { ...state, loading: true, error: null };
    case GET_DISCOVERY_OPPORTUNITIES_SUCCESS:
      return {
        ...state,
        loading: false,
        opportunities: action.payload.data,
        meta: action.payload.meta,
      };
    case GET_DISCOVERY_OPPORTUNITIES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};