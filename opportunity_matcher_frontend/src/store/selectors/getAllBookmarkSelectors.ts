import { RootState } from '../rootReducer';

export const selectAllBookmarks = (state: RootState) => state.getAllBookmarks.bookmarks;
export const selectBookmarksLoading = (state: RootState) => state.getAllBookmarks.loading;
export const selectBookmarksError = (state: RootState) => state.getAllBookmarks.error;