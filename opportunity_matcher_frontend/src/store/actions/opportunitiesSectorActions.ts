import {
  GET_OPPORTUNITIES_SECTOR_COUNTS,
  GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS,
  GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE,
  OpportunitiesSectorCount,
} from "../types/opportunitiesSectorTypes";

export const getOpportunitiesSectorCounts = () => ({
  type: GET_OPPORTUNITIES_SECTOR_COUNTS,
});

export const getOpportunitiesSectorCountsSuccess = (payload: OpportunitiesSectorCount[]) => ({
  type: GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS,
  payload,
});

export const getOpportunitiesSectorCountsFailure = (payload: string) => ({
  type: GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE,
  payload,
});