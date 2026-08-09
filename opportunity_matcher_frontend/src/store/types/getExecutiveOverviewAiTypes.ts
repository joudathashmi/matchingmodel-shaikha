export interface KPI {
  icon: string | undefined;
  name: string;
  value: number;
  unit: string;
  calculatedAt: string;
  subTitle: string;
  kind?: "primary" | "secondary";
  accent?: string;
}

export interface KeyFinding {
  title: string;
  detail: string;
  additionalData: {
    section: string;
    count?: number;
    engine?: string;
  };
  createdAt: string;
}

export interface AIInsight {
  insightType: string;
  description: string;
  score: number;
  createdAt: string;
  source?: string;
}

export interface HeatmapCell {
  opportunityCount: number;
  pursueMatchCount?: number;
  coveredOpportunities?: number;
  coverageRate?: number | null;
  avgPursueScore?: number | null;
  avgMatchScore?: number | null;
  totalValueMillionUsd?: number;
  totalValueBillion?: number;
  density: number;
  tooltip: string;
}

export interface HeatmapData {
  [sector: string]: {
    [range: string]: HeatmapCell;
  };
}

export interface HeatmapMeta {
  engine: string;
  opportunityTotal: number;
  bucketed: number;
  unspecified: number;
  buckets: string[];
  generatedAt: string;
}

export interface ExecutiveOverviewData {
  kpis: KPI[];
  keyFindings: KeyFinding[];
  aiInsights: AIInsight[];
  heatmap: HeatmapData;
  analystEngine?: string;
  heatmapMeta?: HeatmapMeta;
}

export interface ExecutiveOverviewState {
  data: ExecutiveOverviewData | null;
  loading: boolean;
  error: string | null;
}

export const GET_EXECUTIVE_OVERVIEW_REQUEST = "GET_EXECUTIVE_OVERVIEW_REQUEST";
export const GET_EXECUTIVE_OVERVIEW_SUCCESS = "GET_EXECUTIVE_OVERVIEW_SUCCESS";
export const GET_EXECUTIVE_OVERVIEW_FAILURE = "GET_EXECUTIVE_OVERVIEW_FAILURE";

interface GetExecutiveOverviewRequestAction {
  type: typeof GET_EXECUTIVE_OVERVIEW_REQUEST;
}

interface GetExecutiveOverviewSuccessAction {
  type: typeof GET_EXECUTIVE_OVERVIEW_SUCCESS;
  payload: ExecutiveOverviewData;
}

interface GetExecutiveOverviewFailureAction {
  type: typeof GET_EXECUTIVE_OVERVIEW_FAILURE;
  payload: string;
}

export type ExecutiveOverviewActionTypes =
  | GetExecutiveOverviewRequestAction
  | GetExecutiveOverviewSuccessAction
  | GetExecutiveOverviewFailureAction;
