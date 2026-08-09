import axiosClient from '../../api/axiosClient';
import { SectorCount } from '../types/sectorCountsTypes';

export const sectorCountsService = {
  getSectorCounts: async (): Promise<SectorCount[]> => {
    try {
      const response = await axiosClient.get<SectorCount[]>(
        `/executive-overview/sector-counts?ai_decision=Yes&topRank=1`
      );

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch sector counts';
      throw new Error(errorMessage);
    }
  }
};

export default sectorCountsService;
