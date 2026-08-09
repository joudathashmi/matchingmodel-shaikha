export const GET_OPPORTUNITIES_SECTOR_COUNTS = "GET_OPPORTUNITIES_SECTOR_COUNTS";
export const GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS = "GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS";
export const GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE = "GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE";

export interface OpportunitiesSectorCount {
  sector: string;
  count: number;
}

export interface OpportunitiesSectorCountsState {
  sectorCounts: OpportunitiesSectorCount[];
  loading: boolean;
  error: string | null;
}

interface GetOpportunitiesSectorCountsAction {
  type: typeof GET_OPPORTUNITIES_SECTOR_COUNTS;
}

interface GetOpportunitiesSectorCountsSuccessAction {
  type: typeof GET_OPPORTUNITIES_SECTOR_COUNTS_SUCCESS;
  payload: OpportunitiesSectorCount[];
}

interface GetOpportunitiesSectorCountsFailureAction {
  type: typeof GET_OPPORTUNITIES_SECTOR_COUNTS_FAILURE;
  payload: string;
}

export type OpportunitiesSectorCountsActionTypes =
  | GetOpportunitiesSectorCountsAction
  | GetOpportunitiesSectorCountsSuccessAction
  | GetOpportunitiesSectorCountsFailureAction;