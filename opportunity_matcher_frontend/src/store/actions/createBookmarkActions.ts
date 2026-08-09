import {
  CREATE_BOOKMARK_REQUEST,
  CREATE_BOOKMARK_SUCCESS,
  CREATE_BOOKMARK_FAILURE,
  RESET_BOOKMARK_STATE,
  BookmarkRequest,
  Bookmark,
  BookmarkActionTypes
} from "../types/createBookmarkTypes";

// Action Creators
export const createBookmarkRequest = (payload: BookmarkRequest): BookmarkActionTypes => ({
  type: CREATE_BOOKMARK_REQUEST,
  payload,
});

export const createBookmarkSuccess = (payload: Bookmark): BookmarkActionTypes => ({
  type: CREATE_BOOKMARK_SUCCESS,
  payload,
});

export const createBookmarkFailure = (error: string): BookmarkActionTypes => ({
  type: CREATE_BOOKMARK_FAILURE,
  payload: error,
});

export const resetBookmarkState = (): BookmarkActionTypes => ({
  type: RESET_BOOKMARK_STATE,
});