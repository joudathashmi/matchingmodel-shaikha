import axiosClient from "../../api/axiosClient";
import { Bookmark, BookmarkRequest } from "../types/createBookmarkTypes";

export const createBookmarkService = {
  createBookmark: async (bookmarkData: BookmarkRequest): Promise<Bookmark> => {
    const response = await axiosClient.post<Bookmark>("/bookmark", bookmarkData);
    return response.data;
  },
};