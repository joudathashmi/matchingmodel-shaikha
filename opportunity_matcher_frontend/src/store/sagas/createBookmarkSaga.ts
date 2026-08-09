import { call, put, takeEvery } from "redux-saga/effects";
import {
  createBookmarkSuccess,
  createBookmarkFailure
} from "../actions/createBookmarkActions";
import { 
  CREATE_BOOKMARK_REQUEST,
  Bookmark,
  BookmarkRequest,
  CreateBookmarkRequestAction // ← ADD THIS IMPORT
} from "../types/createBookmarkTypes";
import { createBookmarkService } from "../services/createBookmarkService";

function* createBookmarkSaga(action: CreateBookmarkRequestAction): Generator<any, void, Bookmark> {
  try {
    const bookmark: Bookmark = yield call(
      createBookmarkService.createBookmark,
      action.payload
    );
    yield put(createBookmarkSuccess(bookmark));
  } catch (error: any) {
    yield put(createBookmarkFailure(error.response?.data?.message || "Failed to create bookmark"));
  }
}

export function* watchCreateBookmark() {
  yield takeEvery(CREATE_BOOKMARK_REQUEST, createBookmarkSaga);
}