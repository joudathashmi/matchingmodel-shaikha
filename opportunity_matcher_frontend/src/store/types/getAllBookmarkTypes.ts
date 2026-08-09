export interface Bookmark {
  id: number;
  userId: string;
  entityId: number;
  entityType: string;
  createdAt: string;
  details: {
    id: number;
    name: string;
    sector: string;
    url: string;
    opportunity_id: number;
    opportunity_name: string;
    opportunity_sector: string;
    opportunity_url: string;
    company_id: number;
    company_name: string;
    company_sector: string;
    company_url: string;
  } | null;
}

export interface BookmarksState {
  bookmarks: Bookmark[];
  loading: boolean;
  error: string | null;
}

// Action Types
export const GET_ALL_BOOKMARKS_REQUEST = 'GET_ALL_BOOKMARKS_REQUEST';
export const GET_ALL_BOOKMARKS_SUCCESS = 'GET_ALL_BOOKMARKS_SUCCESS';
export const GET_ALL_BOOKMARKS_FAILURE = 'GET_ALL_BOOKMARKS_FAILURE';

interface GetAllBookmarksRequestAction {
  type: typeof GET_ALL_BOOKMARKS_REQUEST;
}

interface GetAllBookmarksSuccessAction {
  type: typeof GET_ALL_BOOKMARKS_SUCCESS;
  payload: Bookmark[];
}

interface GetAllBookmarksFailureAction {
  type: typeof GET_ALL_BOOKMARKS_FAILURE;
  payload: string;
}

export type BookmarksActionTypes =
  | GetAllBookmarksRequestAction
  | GetAllBookmarksSuccessAction
  | GetAllBookmarksFailureAction;