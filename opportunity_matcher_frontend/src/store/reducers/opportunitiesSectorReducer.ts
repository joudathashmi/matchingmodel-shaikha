import {
  GET_OPPORTUNITIES_SECTOR_COUNTS,
  GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS,
  GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE,
  OpportunitiesSectorCountsState,
  OpportunitiesSectorCountsActionTypes,
} from "../types/opportunitiesSectorTypes";

const initialState: OpportunitiesSectorCountsState = {
  sectorCounts: [],
  loading: false,
  error: null,
};

export const opportunitiesSectorReducer = (
  state = initialState,
  action: OpportunitiesSectorCountsActionTypes
): OpportunitiesSectorCountsState => {
  switch (action.type) {
    case GET_OPPORTUNITIES_SECTOR_COUNTS:
      return { ...state, loading: true, error: null };
    case GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS:
      return { ...state, loading: false, sectorCounts: action.payload };
    case GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};