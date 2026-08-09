import axiosClient from "../../api/axiosClient";
import { OpportunitiesResponse, OpportunitiesListRequest } from "../types/getopportunitiesListTypes";

export const opportunitiesService = {
  getOpportunitiesList: async (request: OpportunitiesListRequest): Promise<OpportunitiesResponse> => {
    const response = await axiosClient.post<OpportunitiesResponse>("/opportunities/", request);
    return response.data;
  },
};