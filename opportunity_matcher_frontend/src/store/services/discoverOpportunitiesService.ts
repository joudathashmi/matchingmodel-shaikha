import axiosClient from "../../api/axiosClient";
import {
  DiscoveryOpportunitiesRequest,
  DiscoveryOpportunitiesResponse,
} from "../types/discoverOpportunitiesTypes";

export const discoveryOpportunitiesService = {
  getDiscoveryOpportunities: async (
    request: DiscoveryOpportunitiesRequest
  ): Promise<DiscoveryOpportunitiesResponse> => {
    try {
      const response = await axiosClient.post(
        `/discovery-engine/discovery-engine`,
        request
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Failed to fetch discovery opportunities:", error);
      throw error;
    }
  },
};