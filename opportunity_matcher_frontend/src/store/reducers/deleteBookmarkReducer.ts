import {
  DELETE_BOOKMARK_REQUEST,
  DELETE_BOOKMARK_SUCCESS,
  DELETE_BOOKMARK_FAILURE,
  DeleteBookmarkState,
  DeleteBookmarkActionTypes
} from "../types/deleteBookmarkTypes";

const initialState: DeleteBookmarkState = {
  loading: false,
  error: null,
  success: false,
};

const deleteBookmarkReducer = (
  state = initialState,
  action: DeleteBookmarkActionTypes
): DeleteBookmarkState => {
  switch (action.type) {
    case DELETE_BOOKMARK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        success: false
      };
    case DELETE_BOOKMARK_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        success: true
      };
    case DELETE_BOOKMARK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false
      };
    default:
      return state;
  }
};

export default deleteBookmarkReducer;