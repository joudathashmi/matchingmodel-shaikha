import {
  SectorCountsState,
  SectorCountsActionTypes,
  GET_SECTOR_COUNTS_REQUEST,
  GET_SECTOR_COUNTS_SUCCESS,
  GET_SECTOR_COUNTS_FAILURE,
  CLEAR_SECTOR_COUNTS
} from '../types/sectorCountsTypes';

const initialState: SectorCountsState = {
  data: [],
  loading: false,
  error: null
};

const sectorCountsReducer = (
  state = initialState,
  action: SectorCountsActionTypes
): SectorCountsState => {
  switch (action.type) {
    case GET_SECTOR_COUNTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_SECTOR_COUNTS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null
      };
    case GET_SECTOR_COUNTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: []
      };
    case CLEAR_SECTOR_COUNTS:
      return {
        ...initialState
      };
    default:
      return state;
  }
};

export default sectorCountsReducer;
