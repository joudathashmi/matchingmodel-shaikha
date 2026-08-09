import axiosClient from "../../api/axiosClient";
import { DeleteBookmarkRequest } from "../types/deleteBookmarkTypes";

export const deleteBookmarkAPI = async (data: DeleteBookmarkRequest) => {
  const response = await axiosClient.delete("/bookmark", { data });
  return response.data;
};