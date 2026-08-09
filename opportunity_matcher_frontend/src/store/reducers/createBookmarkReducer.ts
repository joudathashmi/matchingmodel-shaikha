import {
  BookmarkState,
  BookmarkActionTypes,
  CREATE_BOOKMARK_REQUEST,
  CREATE_BOOKMARK_SUCCESS,
  CREATE_BOOKMARK_FAILURE,
  RESET_BOOKMARK_STATE,
} from "../types/createBookmarkTypes";

const initialState: BookmarkState = {
  loading: false,
  error: null,
  success: false,
  createdBookmark: null,
};

const createBookmarkReducer = (
  state = initialState,
  action: BookmarkActionTypes
): BookmarkState => {
  switch (action.type) {
    case CREATE_BOOKMARK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        success: false,
        createdBookmark: null,
      };
    case CREATE_BOOKMARK_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        createdBookmark: action.payload,
        error: null,
      };
    case CREATE_BOOKMARK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false,
        createdBookmark: null,
      };
    case RESET_BOOKMARK_STATE:
      return {
        ...state,
        error: null,
        success: false,
        createdBookmark: null,
      };
    default:
      return state;
  }
};

export default createBookmarkReducer;