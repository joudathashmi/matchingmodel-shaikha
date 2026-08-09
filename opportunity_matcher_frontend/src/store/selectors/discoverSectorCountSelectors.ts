import { RootState } from "../../store";

export const selectDiscoverSectorCount = (state: RootState) =>
  state.discoverSectorCount.data;

export const selectDiscoverSectorCountLoading = (state: RootState) =>
  state.discoverSectorCount.loading;

export const selectDiscoverSectorCountError = (state: RootState) =>
  state.discoverSectorCount.error;