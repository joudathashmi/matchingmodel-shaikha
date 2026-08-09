// actionSectorSelectors.ts
import { RootState } from "../../store";
import { SectorCount } from "../types/actionSectorTypes";

export const selectSectorCountsState = (state: RootState) =>
  state.actionSector;

export const selectSectorCounts = (state: RootState): SectorCount[] =>
  state.actionSector.sectorCounts;

export const selectSectorCountsLoading = (state: RootState): boolean =>
  state.actionSector.loading;

export const selectSectorCountsError = (state: RootState): string | null =>
  state.actionSector.error;
