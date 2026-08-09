import { call, put, takeEvery } from "redux-saga/effects";
import {
  deleteBookmarkSuccess,
  deleteBookmarkFailure
} from "../actions/deleteBookmarkActions";
import { deleteBookmarkAPI } from "../services/deleteBookmarkService";
import { DeleteBookmarkRequest } from "../types/deleteBookmarkTypes";
import { DELETE_BOOKMARK_REQUEST } from "../types/deleteBookmarkTypes"; // Import from types

function* deleteBookmarkSaga(action: { type: string; payload: DeleteBookmarkRequest }) {
  try {
    yield call(deleteBookmarkAPI, action.payload);
    yield put(deleteBookmarkSuccess());
  } catch (error: any) {
    yield put(deleteBookmarkFailure(error.response?.data?.message || "Failed to delete bookmark"));
  }
}

export function* watchDeleteBookmark() {
  yield takeEvery(DELETE_BOOKMARK_REQUEST, deleteBookmarkSaga);
}