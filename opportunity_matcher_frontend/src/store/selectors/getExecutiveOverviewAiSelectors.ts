import { RootState } from "../rootReducer";

export const selectExecutiveOverview = (state: RootState) =>
  state.executiveOverview.data;

export const selectExecutiveOverviewLoading = (state: RootState) =>
  state.executiveOverview.loading;

export const selectExecutiveOverviewError = (state: RootState) =>
  state.executiveOverview.error;

export const selectKPIs = (state: RootState) =>
  state.executiveOverview.data?.kpis || [];

export const selectKeyFindings = (state: RootState) =>
  state.executiveOverview.data?.keyFindings || [];

export const selectAIInsights = (state: RootState) =>
  state.executiveOverview.data?.aiInsights || [];

export const selectHeatmapData = (state: RootState) =>
  state.executiveOverview.data?.heatmap || {};

export const selectAnalystEngine = (state: RootState) =>
  state.executiveOverview.data?.analystEngine || "";

export const selectHeatmapMeta = (state: RootState) =>
  state.executiveOverview.data?.heatmapMeta || null;
