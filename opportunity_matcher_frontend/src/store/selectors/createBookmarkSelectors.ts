import { RootState } from "../rootReducer";
import { Bookmark } from "../types/createBookmarkTypes";

export const selectBookmarkLoading = (state: RootState): boolean =>
  state.bookmarks.loading;

export const selectBookmarkError = (state: RootState): string | null =>
  state.bookmarks.error;

export const selectBookmarkSuccess = (state: RootState): boolean =>
  state.bookmarks.success;

export const selectCreatedBookmark = (state: RootState): Bookmark | null =>
  state.bookmarks.createdBookmark;