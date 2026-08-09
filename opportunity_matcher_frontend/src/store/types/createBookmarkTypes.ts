export interface Bookmark {
  id: number;
  userId: string;
  entityId: number;
  entityType: string;
  createdAt: string;
}

export interface BookmarkRequest {
  entityId: number;
  entityType: string;
}

export interface BookmarkState {
  loading: boolean;
  error: string | null;
  success: boolean;
  createdBookmark: Bookmark | null;
}

// Action Types (Constants)
export const CREATE_BOOKMARK_REQUEST = "CREATE_BOOKMARK_REQUEST";
export const CREATE_BOOKMARK_SUCCESS = "CREATE_BOOKMARK_SUCCESS";
export const CREATE_BOOKMARK_FAILURE = "CREATE_BOOKMARK_FAILURE";
export const RESET_BOOKMARK_STATE = "RESET_BOOKMARK_STATE";

// Action Interfaces (for TypeScript) - MAKE SURE TO EXPORT!
export interface CreateBookmarkRequestAction {
  type: typeof CREATE_BOOKMARK_REQUEST;
  payload: BookmarkRequest;
}

export interface CreateBookmarkSuccessAction {
  type: typeof CREATE_BOOKMARK_SUCCESS;
  payload: Bookmark;
}

export interface CreateBookmarkFailureAction {
  type: typeof CREATE_BOOKMARK_FAILURE;
  payload: string;
}

export interface ResetBookmarkStateAction {
  type: typeof RESET_BOOKMARK_STATE;
}

export type BookmarkActionTypes =
  | CreateBookmarkRequestAction
  | CreateBookmarkSuccessAction
  | CreateBookmarkFailureAction
  | ResetBookmarkStateAction;