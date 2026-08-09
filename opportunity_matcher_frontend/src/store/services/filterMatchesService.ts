// filterMatchesService.ts

import axiosClient from '../../api/axiosClient';
import { ActiveMatchesRequest, ActiveMatchesResponse } from '../types/filterMatchesTypes';

export const activeMatchesService = {
  getActiveMatches: async (request: ActiveMatchesRequest): Promise<ActiveMatchesResponse> => {
    try {
      console.log('🔍 Fetching active matches with:', request);
      const response = await axiosClient.post(`/active-matches/active-opportunity-matches`, request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch active matches:', error);
      throw error;
    }
  }
};
