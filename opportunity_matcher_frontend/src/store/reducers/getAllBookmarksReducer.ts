import {
  BookmarksState,
  BookmarksActionTypes,
  GET_ALL_BOOKMARKS_REQUEST,
  GET_ALL_BOOKMARKS_SUCCESS,
  GET_ALL_BOOKMARKS_FAILURE
} from '../types/getAllBookmarkTypes';

const initialState: BookmarksState = {
  bookmarks: [],
  loading: false,
  error: null
};

const getAllBookmarksReducer = (
  state = initialState,
  action: BookmarksActionTypes
): BookmarksState => {
  switch (action.type) {
    case GET_ALL_BOOKMARKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_ALL_BOOKMARKS_SUCCESS:
      return {
        ...state,
        loading: false,
        bookmarks: action.payload,
        error: null
      };
    case GET_ALL_BOOKMARKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        bookmarks: []
      };
    default:
      return state;
  }
};

export default getAllBookmarksReducer;