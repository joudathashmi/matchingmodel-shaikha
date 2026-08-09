import { RootState } from "../../store";
import { OpportunitiesSectorCount } from "../types/opportunitiesSectorTypes";

export const selectOpportunitiesSectorCountsState = (state: RootState) =>
  state.opportunitiesSector;

export const selectOpportunitiesSectorCounts = (state: RootState): OpportunitiesSectorCount[] =>
  state.opportunitiesSector.sectorCounts;

export const selectOpportunitiesSectorCountsLoading = (state: RootState): boolean =>
  state.opportunitiesSector.loading;

export const selectOpportunitiesSectorCountsError = (state: RootState): string | null =>
  state.opportunitiesSector.error;