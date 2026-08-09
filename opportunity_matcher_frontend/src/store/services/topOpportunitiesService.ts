import axiosClient from '../../api/axiosClient';
import { TopOpportunitiesRequest, TopOpportunitiesResponse } from '../types/topOpportunitiesTypes';

export const topOpportunitiesService = {
  getTopOpportunities: async (request: TopOpportunitiesRequest): Promise<TopOpportunitiesResponse> => {
    try {
      console.log('🔍 Fetching top opportunities with:', request);
      const response = await axiosClient.post(`/executive-overview/top-opportunities`, request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch top opportunities:', error);
      throw error;
    }
  }
};
