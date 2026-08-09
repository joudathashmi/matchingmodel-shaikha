import { RootState } from '../rootReducer';

export const selectSectorCounts = (state: RootState) => state.sectorCounts.data;
export const selectSectorCountsLoading = (state: RootState) => state.sectorCounts.loading;
export const selectSectorCountsError = (state: RootState) => state.sectorCounts.error;
export const selectHasSectorCounts = (state: RootState) =>
  state.sectorCounts.data && state.sectorCounts.data.length > 0;
