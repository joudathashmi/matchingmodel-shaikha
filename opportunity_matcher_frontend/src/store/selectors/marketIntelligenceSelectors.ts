import { RootState } from "../rootReducer";
import { Insight, MarketIntelligenceMeta } from "../types/MarketIntelligenceTypes";

export const selectMarketIntelligenceCategories = (
  state: RootState
): { [category: string]: Insight[] } => state.marketIntelligence.categories;

export const selectMarketIntelligenceMeta = (
  state: RootState
): MarketIntelligenceMeta | null => state.marketIntelligence.meta;

export const selectMarketIntelligenceByCategory = (category: string) =>
  (state: RootState): Insight[] =>
    state.marketIntelligence.categories[category] || [];

export const selectMarketIntelligenceLoading = (state: RootState): boolean =>
  state.marketIntelligence.loading;

export const selectMarketIntelligenceError = (state: RootState): string | null =>
  state.marketIntelligence.error;

export const selectHasMarketIntelligence = (state: RootState): boolean =>
  Object.values(state.marketIntelligence.categories).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
