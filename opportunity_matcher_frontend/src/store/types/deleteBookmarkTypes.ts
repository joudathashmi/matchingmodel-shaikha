export const DELETE_BOOKMARK_REQUEST = 'DELETE_BOOKMARK_REQUEST';
export const DELETE_BOOKMARK_SUCCESS = 'DELETE_BOOKMARK_SUCCESS';
export const DELETE_BOOKMARK_FAILURE = 'DELETE_BOOKMARK_FAILURE';

export interface DeleteBookmarkRequest {
  entityId: number;
  entityType: string;
}

export interface DeleteBookmarkState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface DeleteBookmarkRequestAction {
  type: typeof DELETE_BOOKMARK_REQUEST;
  payload: DeleteBookmarkRequest;
}

interface DeleteBookmarkSuccessAction {
  type: typeof DELETE_BOOKMARK_SUCCESS;
}

interface DeleteBookmarkFailureAction {
  type: typeof DELETE_BOOKMARK_FAILURE;
  payload: string;
}

export type DeleteBookmarkActionTypes = 
  | DeleteBookmarkRequestAction 
  | DeleteBookmarkSuccessAction 
  | DeleteBookmarkFailureAction;