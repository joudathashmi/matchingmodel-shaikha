import axiosClient from "../../api/axiosClient";
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
import { AxiosError } from "axios";

export interface AnalyticsResponse {
  kpis: KPI[];
  growthRates: GrowthRate[];
  performanceAnalytics: PerformanceAnalytics[];
  heatmapValues: HeatmapValue[];
  topMatches: TopMatch[];
  marketPredictions: MarketPrediction[];
  decisionTiers: NamedCount[];
  scoreDistribution: NamedCount[];
  meta: AnalyticsMeta | null;
}

function asNamedCounts(raw: unknown): NamedCount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      name: String((row as any)?.name ?? ""),
      value: Number((row as any)?.value ?? 0) || 0,
    }))
    .filter((r) => r.name);
}

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    try {
      const response = await axiosClient.get(`/ai-data/services/analytics`);
      const raw = response.data || {};
      const meta =
        raw._meta && typeof raw._meta === "object" && !Array.isArray(raw._meta)
          ? (raw._meta as AnalyticsMeta)
          : null;

      return {
        kpis: Array.isArray(raw.kpis) ? raw.kpis : [],
        growthRates: Array.isArray(raw.growthRates) ? raw.growthRates : [],
        performanceAnalytics: Array.isArray(raw.performanceAnalytics)
          ? raw.performanceAnalytics
          : [],
        heatmapValues: Array.isArray(raw.heatmapValues) ? raw.heatmapValues : [],
        topMatches: Array.isArray(raw.topMatches) ? raw.topMatches : [],
        marketPredictions: Array.isArray(raw.marketPredictions)
          ? raw.marketPredictions
          : [],
        decisionTiers: asNamedCounts(raw.decisionTiers),
        scoreDistribution: asNamedCounts(raw.scoreDistribution),
        meta,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(axiosError.message || "Failed to fetch analytics");
    }
  },
};
