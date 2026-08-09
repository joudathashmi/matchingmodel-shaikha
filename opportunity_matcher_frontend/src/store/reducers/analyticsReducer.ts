import {
  GET_ANALYTICS,
  GET_ANALYTICS_SUCCESS,
  GET_ANALYTICS_FAILURE,
  AnalyticsState,
  AnalyticsActionTypes,
} from "../types/analyticsTypes";

const initialState: AnalyticsState = {
  kpis: [],
  growthRates: [],
  performanceAnalytics: [],
  heatmapValues: [],
  topMatches: [],
  marketPredictions: [],
  decisionTiers: [],
  scoreDistribution: [],
  meta: null,
  loading: false,
  error: null,
};

export const analyticsReducer = (
  state = initialState,
  action: AnalyticsActionTypes
): AnalyticsState => {
  switch (action.type) {
    case GET_ANALYTICS:
      return {
        ...state,
        loading: state.kpis.length === 0 && state.topMatches.length === 0,
        error: null,
      };
    case GET_ANALYTICS_SUCCESS:
      return { ...state, loading: false, ...action.payload, error: null };
    case GET_ANALYTICS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
