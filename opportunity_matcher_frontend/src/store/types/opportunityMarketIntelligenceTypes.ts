export interface OpportunityInsight {
  id: number;
  insightType: string;
  title: string;
  description: string;
  score: number;
  createdAt: string;
  source?: string;
}

export interface OpportunityMarketIntelligenceMeta {
  engine?: string;
  generatedAt?: string;
  opportunities?: number;
  matches?: number;
  pursue?: number;
}

// Flexible mapping: category name → array of insights
export interface OpportunityMarketIntelligenceData {
  [category: string]: OpportunityInsight[];
}

export const GET_OPPORTUNITY_MI_REQUEST = "GET_OPPORTUNITY_MI_REQUEST";
export const GET_OPPORTUNITY_MI_SUCCESS = "GET_OPPORTUNITY_MI_SUCCESS";
export const GET_OPPORTUNITY_MI_FAILURE = "GET_OPPORTUNITY_MI_FAILURE";
export const CLEAR_OPPORTUNITY_MI = "CLEAR_OPPORTUNITY_MI";

export interface OpportunityMarketIntelligenceState {
  data: OpportunityMarketIntelligenceData | null;
  meta: OpportunityMarketIntelligenceMeta | null;
  loading: boolean;
  error: string | null;
}

interface GetOpportunityMIRequestAction {
  type: typeof GET_OPPORTUNITY_MI_REQUEST;
}

interface GetOpportunityMISuccessAction {
  type: typeof GET_OPPORTUNITY_MI_SUCCESS;
  payload: {
    data: OpportunityMarketIntelligenceData;
    meta: OpportunityMarketIntelligenceMeta | null;
  };
}

interface GetOpportunityMIFailureAction {
  type: typeof GET_OPPORTUNITY_MI_FAILURE;
  payload: string;
}

interface ClearOpportunityMIAction {
  type: typeof CLEAR_OPPORTUNITY_MI;
}

export type OpportunityMarketIntelligenceActionTypes =
  | GetOpportunityMIRequestAction
  | GetOpportunityMISuccessAction
  | GetOpportunityMIFailureAction
  | ClearOpportunityMIAction;
