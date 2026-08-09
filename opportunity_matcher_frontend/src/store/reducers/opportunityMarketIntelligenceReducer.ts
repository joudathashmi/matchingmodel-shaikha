import {
  OpportunityMarketIntelligenceState,
  OpportunityMarketIntelligenceActionTypes,
  GET_OPPORTUNITY_MI_REQUEST,
  GET_OPPORTUNITY_MI_SUCCESS,
  GET_OPPORTUNITY_MI_FAILURE,
  CLEAR_OPPORTUNITY_MI,
} from "../types/opportunityMarketIntelligenceTypes";

const initialState: OpportunityMarketIntelligenceState = {
  data: null,
  meta: null,
  loading: false,
  error: null,
};

const opportunityMarketIntelligenceReducer = (
  state = initialState,
  action: OpportunityMarketIntelligenceActionTypes
): OpportunityMarketIntelligenceState => {
  switch (action.type) {
    case GET_OPPORTUNITY_MI_REQUEST:
      return {
        ...state,
        loading: !state.data,
        error: null,
      };
    case GET_OPPORTUNITY_MI_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload.data,
        meta: action.payload.meta,
        error: null,
      };
    case GET_OPPORTUNITY_MI_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CLEAR_OPPORTUNITY_MI:
      return { ...initialState };
    default:
      return state;
  }
};

export default opportunityMarketIntelligenceReducer;
