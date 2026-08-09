export interface DiscoverSectorCount {
  sector: string;
  count: number;
}

export interface DiscoverSectorCountState {
  data: DiscoverSectorCount[];
  loading: boolean;
  error: string | null;
}

export const GET_DISCOVER_SECTOR_COUNT_REQUEST = "GET_DISCOVER_SECTOR_COUNT_REQUEST";
export const GET_DISCOVER_SECTOR_COUNT_SUCCESS = "GET_DISCOVER_SECTOR_COUNT_SUCCESS";
export const GET_DISCOVER_SECTOR_COUNT_FAILURE = "GET_DISCOVER_SECTOR_COUNT_FAILURE";

interface GetDiscoverSectorCountRequestAction {
  type: typeof GET_DISCOVER_SECTOR_COUNT_REQUEST;
}

interface GetDiscoverSectorCountSuccessAction {
  type: typeof GET_DISCOVER_SECTOR_COUNT_SUCCESS;
  payload: DiscoverSectorCount[];
}

interface GetDiscoverSectorCountFailureAction {
  type: typeof GET_DISCOVER_SECTOR_COUNT_FAILURE;
  payload: string;
}

export type DiscoverSectorCountActionTypes =
  | GetDiscoverSectorCountRequestAction
  | GetDiscoverSectorCountSuccessAction
  | GetDiscoverSectorCountFailureAction;
