export const GET_SECTOR_COUNTS_REQUEST = 'GET_SECTOR_COUNTS_REQUEST';
export const GET_SECTOR_COUNTS_SUCCESS = 'GET_SECTOR_COUNTS_SUCCESS';
export const GET_SECTOR_COUNTS_FAILURE = 'GET_SECTOR_COUNTS_FAILURE';
export const CLEAR_SECTOR_COUNTS = 'CLEAR_SECTOR_COUNTS';

export interface SectorCount {
  sector: string;
  count: number;
}

export interface SectorCountsState {
  data: SectorCount[];
  loading: boolean;
  error: string | null;
}

interface GetSectorCountsRequestAction {
  type: typeof GET_SECTOR_COUNTS_REQUEST;
}

interface GetSectorCountsSuccessAction {
  type: typeof GET_SECTOR_COUNTS_SUCCESS;
  payload: SectorCount[];
}

interface GetSectorCountsFailureAction {
  type: typeof GET_SECTOR_COUNTS_FAILURE;
  payload: string;
}

interface ClearSectorCountsAction {
  type: typeof CLEAR_SECTOR_COUNTS;
}

export type SectorCountsActionTypes =
  | GetSectorCountsRequestAction
  | GetSectorCountsSuccessAction
  | GetSectorCountsFailureAction
  | ClearSectorCountsAction;
