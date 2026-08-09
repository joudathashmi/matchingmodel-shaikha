import { RootState } from "../rootReducer";
import {
  KPI,
  GrowthRate,
  PerformanceAnalytics,
  HeatmapValue,
  TopMatch,
  MarketPrediction,
  NamedCount,
  AnalyticsMeta,
} from "../types/analyticsTypes";

export const selectAnalyticsState = (state: RootState) => state.analytics;

export const selectAnalyticsKpis = (state: RootState): KPI[] =>
  state.analytics.kpis;

export const selectAnalyticsGrowthRates = (state: RootState): GrowthRate[] =>
  state.analytics.growthRates;

export const selectAnalyticsPerformance = (
  state: RootState
): PerformanceAnalytics[] => state.analytics.performanceAnalytics;

export const selectAnalyticsHeatmap = (state: RootState): HeatmapValue[] =>
  state.analytics.heatmapValues;

export const selectAnalyticsTopMatches = (state: RootState): TopMatch[] =>
  state.analytics.topMatches;

export const selectAnalyticsMarketPredictions = (
  state: RootState
): MarketPrediction[] => state.analytics.marketPredictions;

export const selectAnalyticsDecisionTiers = (state: RootState): NamedCount[] =>
  state.analytics.decisionTiers;

export const selectAnalyticsScoreDistribution = (
  state: RootState
): NamedCount[] => state.analytics.scoreDistribution;

export const selectAnalyticsMeta = (state: RootState): AnalyticsMeta | null =>
  state.analytics.meta;

export const selectAnalyticsLoading = (state: RootState): boolean =>
  state.analytics.loading;

export const selectAnalyticsError = (state: RootState): string | null =>
  state.analytics.error;
