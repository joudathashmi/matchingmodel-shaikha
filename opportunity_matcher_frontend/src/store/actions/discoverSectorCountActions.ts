import {
  GET_DISCOVER_SECTOR_COUNT_REQUEST,
  GET_DISCOVER_SECTOR_COUNT_SUCCESS,
  GET_DISCOVER_SECTOR_COUNT_FAILURE,
  DiscoverSectorCount,
  DiscoverSectorCountActionTypes,
} from "../types/discoverSectorCountTypes";

export const getDiscoverSectorCountRequest = (): DiscoverSectorCountActionTypes => ({
  type: GET_DISCOVER_SECTOR_COUNT_REQUEST,
});

export const getDiscoverSectorCountSuccess = (
  data: DiscoverSectorCount[]
): DiscoverSectorCountActionTypes => ({
  type: GET_DISCOVER_SECTOR_COUNT_SUCCESS,
  payload: data,
});

export const getDiscoverSectorCountFailure = (
  error: string
): DiscoverSectorCountActionTypes => ({
  type: GET_DISCOVER_SECTOR_COUNT_FAILURE,
  payload: error,
});