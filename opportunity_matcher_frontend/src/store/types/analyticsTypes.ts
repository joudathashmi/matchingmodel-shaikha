// Action Types
export const GET_ANALYTICS = "GET_ANALYTICS";
export const GET_ANALYTICS_SUCCESS = "GET_ANALYTICS_SUCCESS";
export const GET_ANALYTICS_FAILURE = "GET_ANALYTICS_FAILURE";

// --- Interfaces for API entities ---
export interface KPI {
  name: string;
  value: number;
  unit: string;
  calculatedAt: string;
}

export interface GrowthRate {
  name: string;
  value: number;
  unit: string;
  calculatedAt: string;
}

export interface PerformanceAnalytics {
  name: string;
  value: number;
  unit: string;
  calculatedAt: string;
}

export interface HeatmapValue {
  name: string;
  value: number;
  unit: string;
  calculatedAt: string;
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface TopMatch {
  insightType: string;
  description: string;
  score: number;
  createdAt: string;
  companyName: string;
  sector: string;
  aiDecision: string;
}

export interface MarketPrediction {
  insightType: string;
  description: string;
  score: number;
  createdAt: string;
  source?: string;
}

export interface AnalyticsMeta {
  engine?: string;
  generatedAt?: string;
  companies?: number;
  opportunities?: number;
  matches?: number;
  pursue?: number;
  excellent?: number;
  strong?: number;
  good?: number;
  highConfidence?: number;
  highConfidencePursue?: number;
  companiesCovered?: number;
  companiesWithPursue?: number;
  coldCompanies?: number;
  opportunitiesWithPursue?: number;
  medianPursueScore?: number;
  p75PursueScore?: number;
  avgPursueScore?: number;
  companyCoverage?: number;
  highConfShare?: number;
}

// --- Root State ---
export interface AnalyticsState {
  kpis: KPI[];
  growthRates: GrowthRate[];
  performanceAnalytics: PerformanceAnalytics[];
  heatmapValues: HeatmapValue[];
  topMatches: TopMatch[];
  marketPredictions: MarketPrediction[];
  decisionTiers: NamedCount[];
  scoreDistribution: NamedCount[];
  meta: AnalyticsMeta | null;
  loading: boolean;
  error: string | null;
}

// --- Action Interfaces ---
interface GetAnalyticsAction {
  type: typeof GET_ANALYTICS;
}

interface GetAnalyticsSuccessAction {
  type: typeof GET_ANALYTICS_SUCCESS;
  payload: Omit<AnalyticsState, "loading" | "error">;
}

interface GetAnalyticsFailureAction {
  type: typeof GET_ANALYTICS_FAILURE;
  payload: string;
}

export type AnalyticsActionTypes =
  | GetAnalyticsAction
  | GetAnalyticsSuccessAction
  | GetAnalyticsFailureAction;
