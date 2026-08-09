import axiosClient from "../../api/axiosClient";
import { DiscoverSectorCount } from "../types/discoverSectorCountTypes";
import { AxiosError } from "axios";

export const discoverSectorCountService = {
  getSectorCounts: async (): Promise<DiscoverSectorCount[]> => {
    try {
      console.log("Making request to /discovery-engine/sector-counts");
      
      const response = await axiosClient.get(`/discovery-engine/sector-counts`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching sector counts:", error);
      throw error; 
    }
  },
};