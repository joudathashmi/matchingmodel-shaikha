import {
  MarketIntelligenceState,
  MarketIntelligenceActionTypes,
  GET_MARKET_INTELLIGENCE_REQUEST,
  GET_MARKET_INTELLIGENCE_SUCCESS,
  GET_MARKET_INTELLIGENCE_FAILURE,
  CLEAR_MARKET_INTELLIGENCE,
} from "../types/MarketIntelligenceTypes";

const initialState: MarketIntelligenceState = {
  categories: {},
  meta: null,
  loading: false,
  error: null,
};

const marketIntelligenceReducer = (
  state = initialState,
  action: MarketIntelligenceActionTypes
): MarketIntelligenceState => {
  switch (action.type) {
    case GET_MARKET_INTELLIGENCE_REQUEST:
      return {
        ...state,
        // Keep cards visible while live-refreshing
        loading: Object.keys(state.categories).length === 0,
        error: null,
      };

    case GET_MARKET_INTELLIGENCE_SUCCESS:
      return {
        ...state,
        loading: false,
        categories: action.payload.categories,
        meta: action.payload.meta,
        error: null,
      };

    case GET_MARKET_INTELLIGENCE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case CLEAR_MARKET_INTELLIGENCE:
      return { ...initialState };

    default:
      return state;
  }
};

export default marketIntelligenceReducer;
