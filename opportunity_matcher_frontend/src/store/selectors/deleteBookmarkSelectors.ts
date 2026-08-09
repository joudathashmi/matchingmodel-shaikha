import { RootState } from "../rootReducer";

export const selectDeleteBookmarkLoading = (state: RootState): boolean => 
  state.deleteBookmark.loading;

export const selectDeleteBookmarkError = (state: RootState): string | null => 
  state.deleteBookmark.error;

export const selectDeleteBookmarkSuccess = (state: RootState): boolean => 
  state.deleteBookmark.success;