export const GET_SECTOR_COUNTS = "GET_SECTOR_COUNTS";
export const GET_SECTOR_COUNTS_SUCCESS = "GET_SECTOR_COUNTS_SUCCESS";
export const GET_SECTOR_COUNTS_FAILURE = "GET_SECTOR_COUNTS_FAILURE";

export interface SectorCount {
  sector: string;
  count: number;
}

export interface SectorCountsState {
  sectorCounts: SectorCount[];
  loading: boolean;
  error: string | null;
}
