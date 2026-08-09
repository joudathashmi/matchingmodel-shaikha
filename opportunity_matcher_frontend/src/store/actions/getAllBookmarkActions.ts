import {
  GET_ALL_BOOKMARKS_REQUEST,
  GET_ALL_BOOKMARKS_SUCCESS,
  GET_ALL_BOOKMARKS_FAILURE,
  Bookmark
} from '../types/getAllBookmarkTypes';

export const getAllBookmarksRequest = () => ({
  type: GET_ALL_BOOKMARKS_REQUEST
});

export const getAllBookmarksSuccess = (bookmarks: Bookmark[]) => ({
  type: GET_ALL_BOOKMARKS_SUCCESS,
  payload: bookmarks
});

export const getAllBookmarksFailure = (error: string) => ({
  type: GET_ALL_BOOKMARKS_FAILURE,
  payload: error
});