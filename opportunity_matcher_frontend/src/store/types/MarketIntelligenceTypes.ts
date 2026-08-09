// Action Types
export const GET_MARKET_INTELLIGENCE_REQUEST = "GET_MARKET_INTELLIGENCE_REQUEST";
export const GET_MARKET_INTELLIGENCE_SUCCESS = "GET_MARKET_INTELLIGENCE_SUCCESS";
export const GET_MARKET_INTELLIGENCE_FAILURE = "GET_MARKET_INTELLIGENCE_FAILURE";
export const CLEAR_MARKET_INTELLIGENCE = "CLEAR_MARKET_INTELLIGENCE";

// Common Insight Interface
export interface Insight {
  id: number;
  insightType: string;
  title: string;
  description: string;
  score: number;
  createdAt: string;
  source?: string;
}

export interface MarketIntelligenceMeta {
  engine?: string;
  generatedAt?: string;
  companies?: number;
  matches?: number;
  pursue?: number;
}

// State Shape
export interface MarketIntelligenceState {
  categories: {
    [category: string]: Insight[];
  };
  meta: MarketIntelligenceMeta | null;
  loading: boolean;
  error: string | null;
}

// Action Interfaces
interface GetMarketIntelligenceRequestAction {
  type: typeof GET_MARKET_INTELLIGENCE_REQUEST;
}

interface GetMarketIntelligenceSuccessAction {
  type: typeof GET_MARKET_INTELLIGENCE_SUCCESS;
  payload: {
    categories: { [category: string]: Insight[] };
    meta: MarketIntelligenceMeta | null;
  };
}

interface GetMarketIntelligenceFailureAction {
  type: typeof GET_MARKET_INTELLIGENCE_FAILURE;
  payload: string;
}

interface ClearMarketIntelligenceAction {
  type: typeof CLEAR_MARKET_INTELLIGENCE;
}

// Union Type for Actions
export type MarketIntelligenceActionTypes =
  | GetMarketIntelligenceRequestAction
  | GetMarketIntelligenceSuccessAction
  | GetMarketIntelligenceFailureAction
  | ClearMarketIntelligenceAction;
