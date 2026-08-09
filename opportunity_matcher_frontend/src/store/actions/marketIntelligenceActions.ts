import {
  GET_MARKET_INTELLIGENCE_REQUEST,
  GET_MARKET_INTELLIGENCE_SUCCESS,
  GET_MARKET_INTELLIGENCE_FAILURE,
  CLEAR_MARKET_INTELLIGENCE,
  Insight,
  MarketIntelligenceMeta,
} from "../types/MarketIntelligenceTypes";

export const getMarketIntelligenceRequest = () => ({
  type: GET_MARKET_INTELLIGENCE_REQUEST,
});

export const getMarketIntelligenceSuccess = (data: {
  categories: { [category: string]: Insight[] };
  meta: MarketIntelligenceMeta | null;
}) => ({
  type: GET_MARKET_INTELLIGENCE_SUCCESS,
  payload: data,
});

export const getMarketIntelligenceFailure = (error: string) => ({
  type: GET_MARKET_INTELLIGENCE_FAILURE,
  payload: error,
});

export const clearMarketIntelligence = () => ({
  type: CLEAR_MARKET_INTELLIGENCE,
});
