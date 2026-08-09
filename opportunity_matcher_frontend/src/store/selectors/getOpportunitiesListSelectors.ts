import { RootState } from "../rootReducer";

export const selectOpportunities = (state: RootState) => state.opportunities.data;
export const selectOpportunitiesMeta = (state: RootState) => state.opportunities.meta;
export const selectOpportunitiesLoading = (state: RootState) => state.opportunities.loading;
export const selectOpportunitiesError = (state: RootState) => state.opportunities.error;
export const selectOpportunitiesFilters = (state: RootState) => state.opportunities.filters;

export const selectTotalOpportunities = (state: RootState) => state.opportunities.meta?.total || 0;
export const selectCurrentPage = (state: RootState) => state.opportunities.meta?.page || 1;
export const selectTotalPages = (state: RootState) => state.opportunities.meta?.totalPages || 1;