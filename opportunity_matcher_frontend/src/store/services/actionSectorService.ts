import axiosClient from "../../api/axiosClient";
import { SectorCount } from "../types/actionSectorTypes";
import { AxiosError } from "axios";

export const actionSectorService = {
  getSectorCounts: async (): Promise<SectorCount[]> => {
    try {
      console.log("🔍 Making request to /active-matches/sector-counts");

      const response = await axiosClient.get(`/active-matches/sector-counts`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error("❌ Error fetching sector counts:", axiosError.message);
      throw error; 
    }
  },
};
