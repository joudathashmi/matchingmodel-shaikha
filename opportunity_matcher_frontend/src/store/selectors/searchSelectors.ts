import { RootState } from "../../store";

export const selectSearchResults = (state: RootState) => state.search.results;
export const selectSearchLoading = (state: RootState) => state.search.loading;
export const selectSearchQuery = (state: RootState) => state.search.query;
