import { call, put, takeEvery } from 'redux-saga/effects';
import {
  getAllBookmarksRequest,
  getAllBookmarksSuccess,
  getAllBookmarksFailure
} from '../actions/getAllBookmarkActions';
import { bookmarkService } from '../services/getAllBookmarkService';
import { GET_ALL_BOOKMARKS_REQUEST } from '../types/getAllBookmarkTypes';

function* getAllBookmarksSaga(): Generator<any, void, any> {
  try {
    const bookmarks = yield call(bookmarkService.getAllBookmarks);
    yield put(getAllBookmarksSuccess(bookmarks));
  } catch (error: any) {
    yield put(getAllBookmarksFailure(error.message || 'Failed to fetch bookmarks'));
  }
}

export function* watchGetAllBookmarks() {
  yield takeEvery(GET_ALL_BOOKMARKS_REQUEST, getAllBookmarksSaga);
}