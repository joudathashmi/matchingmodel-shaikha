import {
  GET_SECTOR_COUNTS_REQUEST,
  GET_SECTOR_COUNTS_SUCCESS,
  GET_SECTOR_COUNTS_FAILURE,
  CLEAR_SECTOR_COUNTS,
  SectorCount
} from '../types/sectorCountsTypes';

export const getSectorCountsRequest = () => ({
  type: GET_SECTOR_COUNTS_REQUEST
});

export const getSectorCountsSuccess = (data: SectorCount[]) => ({
  type: GET_SECTOR_COUNTS_SUCCESS,
  payload: data
});

export const getSectorCountsFailure = (error: string) => ({
  type: GET_SECTOR_COUNTS_FAILURE,
  payload: error
});

export const clearSectorCounts = () => ({
  type: CLEAR_SECTOR_COUNTS
});
