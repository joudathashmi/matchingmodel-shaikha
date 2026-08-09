import {
  GET_SECTOR_COUNTS,
  GET_SECTOR_COUNTS_SUCCESS,
  GET_SECTOR_COUNTS_FAILURE,
  SectorCountsState,
} from "../types/actionSectorTypes";
import { SectorCountsActionTypes } from "../actions/actionSectorActions";

const initialState: SectorCountsState = {
  sectorCounts: [],
  loading: false,
  error: null,
};

export const actionSectorReducer = (
  state = initialState,
  action: SectorCountsActionTypes
): SectorCountsState => {
  switch (action.type) {
    case GET_SECTOR_COUNTS:
      return { ...state, loading: true, error: null };
    case GET_SECTOR_COUNTS_SUCCESS:
      return { ...state, loading: false, sectorCounts: action.payload };
    case GET_SECTOR_COUNTS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};