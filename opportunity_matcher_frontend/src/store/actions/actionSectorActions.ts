import {
  GET_SECTOR_COUNTS,
  GET_SECTOR_COUNTS_SUCCESS,
  GET_SECTOR_COUNTS_FAILURE,
  SectorCount,
} from "../types/actionSectorTypes";

export const getSectorCounts = () => ({
  type: GET_SECTOR_COUNTS as typeof GET_SECTOR_COUNTS,
});

export const getSectorCountsSuccess = (payload: SectorCount[]) => ({
  type: GET_SECTOR_COUNTS_SUCCESS as typeof GET_SECTOR_COUNTS_SUCCESS,
  payload,
});

export const getSectorCountsFailure = (payload: string) => ({
  type: GET_SECTOR_COUNTS_FAILURE as typeof GET_SECTOR_COUNTS_FAILURE,
  payload,
});

export type SectorCountsActionTypes =
  | ReturnType<typeof getSectorCounts>
  | ReturnType<typeof getSectorCountsSuccess>
  | ReturnType<typeof getSectorCountsFailure>;
