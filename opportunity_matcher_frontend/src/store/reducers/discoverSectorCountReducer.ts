import {
  DiscoverSectorCountState,
  DiscoverSectorCountActionTypes,
  GET_DISCOVER_SECTOR_COUNT_REQUEST,
  GET_DISCOVER_SECTOR_COUNT_SUCCESS,
  GET_DISCOVER_SECTOR_COUNT_FAILURE,
} from "../types/discoverSectorCountTypes";

const initialState: DiscoverSectorCountState = {
  data: [],
  loading: false,
  error: null,
};

export const discoverSectorCountReducer = (
  state = initialState,
  action: DiscoverSectorCountActionTypes
): DiscoverSectorCountState => {
  switch (action.type) {
    case GET_DISCOVER_SECTOR_COUNT_REQUEST:
      return { ...state, loading: true, error: null };
    case GET_DISCOVER_SECTOR_COUNT_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case GET_DISCOVER_SECTOR_COUNT_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};