import axiosClient from "../../api/axiosClient";
import { ActiveMatch } from "../types/filterMatchesTypes";

export const getMatchById = async (id: number): Promise<ActiveMatch> => {
  const response = await axiosClient.get(`/active-matches/match/${id}`);
  return response.data.data;
};
