import { RootState } from "../rootReducer";
import {
  OpportunityMarketIntelligenceData,
  OpportunityMarketIntelligenceMeta,
} from "../types/opportunityMarketIntelligenceTypes";

export const selectOpportunityMI = (
  state: RootState
): OpportunityMarketIntelligenceData | null =>
  state.opportunityMarketIntelligence.data;

export const selectOpportunityMIMeta = (
  state: RootState
): OpportunityMarketIntelligenceMeta | null =>
  state.opportunityMarketIntelligence.meta;

export const selectOpportunityMILoading = (state: RootState): boolean =>
  state.opportunityMarketIntelligence.loading;

export const selectOpportunityMIError = (state: RootState): string | null =>
  state.opportunityMarketIntelligence.error;

export const selectHasOpportunityMI = (state: RootState): boolean =>
  !!state.opportunityMarketIntelligence.data;
