import {
  DELETE_BOOKMARK_REQUEST,
  DELETE_BOOKMARK_SUCCESS,
  DELETE_BOOKMARK_FAILURE,
  DeleteBookmarkRequest,
  DeleteBookmarkActionTypes
} from "../types/deleteBookmarkTypes";

export const deleteBookmarkRequest = (data: DeleteBookmarkRequest): DeleteBookmarkActionTypes => ({
  type: DELETE_BOOKMARK_REQUEST,
  payload: data
});

export const deleteBookmarkSuccess = (): DeleteBookmarkActionTypes => ({
  type: DELETE_BOOKMARK_SUCCESS
});

export const deleteBookmarkFailure = (error: string): DeleteBookmarkActionTypes => ({
  type: DELETE_BOOKMARK_FAILURE,
  payload: error
});