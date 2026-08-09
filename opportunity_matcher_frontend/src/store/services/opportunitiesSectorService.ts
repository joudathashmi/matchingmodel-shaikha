import axiosClient from "../../api/axiosClient";
import { OpportunitiesSectorCount } from "../types/opportunitiesSectorTypes";
import { AxiosError } from "axios";

export const opportunitiesSectorService = {
  getSectorCounts: async (): Promise<OpportunitiesSectorCount[]> => {
    try {
      const response = await axiosClient.get(`/opportunities/sector-counts`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("Error fetching opportunities sector counts:", axiosError.message);
      throw error; 
    }
  },
};