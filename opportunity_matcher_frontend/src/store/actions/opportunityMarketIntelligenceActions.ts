import {
  GET_OPPORTUNITY_MI_REQUEST,
  GET_OPPORTUNITY_MI_SUCCESS,
  GET_OPPORTUNITY_MI_FAILURE,
  CLEAR_OPPORTUNITY_MI,
  OpportunityMarketIntelligenceData,
  OpportunityMarketIntelligenceMeta,
  OpportunityMarketIntelligenceActionTypes,
} from "../types/opportunityMarketIntelligenceTypes";

export const getOpportunityMIRequest = (): OpportunityMarketIntelligenceActionTypes => ({
  type: GET_OPPORTUNITY_MI_REQUEST,
});

export const getOpportunityMISuccess = (payload: {
  data: OpportunityMarketIntelligenceData;
  meta: OpportunityMarketIntelligenceMeta | null;
}): OpportunityMarketIntelligenceActionTypes => ({
  type: GET_OPPORTUNITY_MI_SUCCESS,
  payload,
});

export const getOpportunityMIFailure = (
  error: string
): OpportunityMarketIntelligenceActionTypes => ({
  type: GET_OPPORTUNITY_MI_FAILURE,
  payload: error,
});

export const clearOpportunityMI = (): OpportunityMarketIntelligenceActionTypes => ({
  type: CLEAR_OPPORTUNITY_MI,
});
